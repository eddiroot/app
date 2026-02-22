import { queueStatusEnum } from '$lib/enums.js';
import {
	getInProgressTimetableQueues,
	getOldestQueuedTimetable,
	updateTimetableQueueStatus,
} from '$lib/server/db/service/index.js';
import { FETDockerService } from '$lib/server/fet';
import { getPresignedUrl, uploadBufferHelper } from '$lib/server/obj.js';
import { parseTimetableCSVAndPopulateClasses } from '../utils';

const fetService = new FETDockerService();

export async function processTimetableQueue() {
	const start = Date.now();

	try {
		// Check for existing in-progress tasks
		const inProgressQueues = await getInProgressTimetableQueues();
		if (inProgressQueues.length > 0) {
			return;
		}

		// Get the oldest queued task
		const queueEntry = await getOldestQueuedTimetable();
		if (!queueEntry) {
			console.error(
				'📭 [TIMETABLE PROCESSOR] No queued timetables found. Nothing to process.',
			);
			return;
		}

		// Mark task as in progress
		await updateTimetableQueueStatus(
			queueEntry.tt_queue.id,
			queueStatusEnum.inProgress,
		);

		// Docker container paths - use a dedicated working directory
		const workingDir = `/app/timetables/${queueEntry.tt_queue.id}`;
		const containerTempPath = `${workingDir}/input/${queueEntry.tt_queue.fileName}`;
		const containerOutputDir = `${workingDir}/output`;

		try {
			const schoolId = queueEntry.sch.id.toString();
			const timetableId = queueEntry.tt_queue.timetableId.toString();
			const timetableDraftId = queueEntry.tt_queue.timetableDraftId.toString();
			const fileName = queueEntry.tt_queue.fileName;

			// Retrieve the timetable file from object storage
			const fileUrl = await getPresignedUrl(
				`${schoolId}/${timetableId}/${timetableDraftId}/input/${fileName}`,
				15 * 60, // 15 minutes
			);

			const response = await fetch(fileUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch timetable file: ${response.statusText}`,
				);
			}
			const fileBuffer = Buffer.from(await response.arrayBuffer());

			console.log(
				`📥 [TIMETABLE PROCESSOR] Retrieved file from storage: ${schoolId}/${timetableId}/${timetableDraftId}/input/${fileName} (${fileBuffer.length} bytes)`,
			);

			// Create working directories in container
			await fetService.createDirectory(workingDir);
			await fetService.createDirectory(`${workingDir}/input`);
			await fetService.createDirectory(containerOutputDir);

			console.log(
				`📁 [TIMETABLE PROCESSOR] Created working directories in container`,
			);

			// Stream file directly to Docker container using FETDockerService
			await fetService.streamFileToContainer(containerTempPath, fileBuffer);

			console.log(
				`📤 [TIMETABLE PROCESSOR] Streamed file to container: ${containerTempPath}`,
			);

			// Execute FET processing
			const fetResult = await fetService.executeFET(
				containerTempPath,
				containerOutputDir,
			);

			console.log(
				`🔄 [TIMETABLE PROCESSOR] FET execution completed. Success: ${fetResult.success}, Time: ${(fetResult.executionTime / 1000).toFixed(2)}s`,
			);

			if (!fetResult.success && fetResult.error) {
				throw new Error(`FET processing failed: ${fetResult.stdout}`);
			}

			// List output files in container
			const allFiles = await fetService.listFiles(containerOutputDir);

			console.log(
				`📂 [TIMETABLE PROCESSOR] Found ${allFiles.length} output files`,
			);

			// Upload ALL generated files to object storage
			if (allFiles.length > 0) {
				let timetableCSV = ''; // find the file that has all the information that we need

				for (const filePath of allFiles) {
					try {
						const fileName = filePath.split('/').pop() || 'unknown';
						const fileExtension =
							fileName.split('.').pop()?.toLowerCase() || '';

						// Read file content from container using FETDockerService
						const fileContent = await fetService.readFile(filePath);

						// Check for specific files needed for database processing (suffix match)
						if (fileName.endsWith('timetable.csv')) {
							timetableCSV = fileContent;
						}

						// Determine content type based on file extension
						let contentType = 'application/octet-stream';
						if (fileExtension === 'html' || fileExtension === 'htm') {
							contentType = 'text/html';
						} else if (fileExtension === 'xml' || fileExtension === 'fet') {
							contentType = 'application/xml';
						} else if (fileExtension === 'csv') {
							contentType = 'text/csv';
						} else if (fileExtension === 'txt') {
							contentType = 'text/plain';
						}

						// Upload with draft structure: {schoolId}/{timetableId}/{timetableDraftId}/output/{fileName}
						const outputObjectKey = `${schoolId}/${timetableId}/${timetableDraftId}/output/${fileName}`;
						await uploadBufferHelper(
							Buffer.from(fileContent, 'utf-8'),
							outputObjectKey,
							contentType,
						);
					} catch (fileError) {
						console.warn(
							`   ⚠️  Failed to upload file ${filePath}:`,
							fileError,
						);
					}
				}

				// Process database files if both are available
				if (timetableCSV) {
					try {
						await parseTimetableCSVAndPopulateClasses(
							timetableCSV,
							queueEntry.tt_queue.timetableId,
							queueEntry.tt_queue.timetableDraftId,
						);

						await updateTimetableQueueStatus(
							queueEntry.tt_queue.id,
							queueStatusEnum.completed,
						);
					} catch (dbError) {
						console.error('📊 [DATABASE PROCESSOR] Database error details:', {
							message:
								dbError instanceof Error
									? dbError.message
									: 'Unknown database error',
							stack: dbError instanceof Error ? dbError.stack : undefined,
							timetableId: timetableId,
						});
					}
				} else {
					throw new Error(
						'FET processing completed but no output files were generated',
					);
				}
			} else {
				throw new Error(
					'FET processing completed but no output files were generated',
				);
			}
		} catch (processingError) {
			// Capture and store the error message in the draft
			const errorMessage =
				processingError instanceof Error
					? processingError.message
					: 'Unknown error';

			// Store error message in draft if not already stored
			await updateTimetableQueueStatus(
				queueEntry.tt_queue.id,
				queueStatusEnum.failed,
			);
			console.error(
				'❌ [TIMETABLE PROCESSOR] Error during timetable processing:',
				processingError,
			);

			// Extract error details from the error object
			const errorDetails =
				processingError &&
				typeof processingError === 'object' &&
				'stdout' in processingError
					? String(processingError.stdout)
					: errorMessage;

			console.error('❌ [TIMETABLE PROCESSOR] Error details:', errorDetails);

			// Mark task as failed
			await updateTimetableQueueStatus(
				queueEntry.tt_queue.id,
				queueStatusEnum.failed,
				new Date(),
			);
		} finally {
			// Always attempt cleanup of the specific working directory
			try {
				const workingDir = `/app/timetables/${queueEntry.tt_queue.id}`;
				await fetService.removeDirectory(workingDir);
				console.log(
					`🧹 [TIMETABLE PROCESSOR] Cleaned up working directory: ${workingDir}`,
				);
			} catch (cleanupError) {
				console.error(
					'🧹 [TIMETABLE PROCESSOR] Cleanup failed after processing error:',
					cleanupError,
				);
			}
		}
	} catch (error) {
		console.error(
			'❌ [TIMETABLE PROCESSOR] Critical error in processTimetableQueue:',
			error,
		);
	} finally {
		const totalTime = Date.now() - start;
		console.log(
			`⏱️  [TIMETABLE PROCESSOR] Process completed in ${(totalTime / 1000).toFixed(2)} seconds`,
		);
	}
}
