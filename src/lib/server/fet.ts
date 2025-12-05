import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FETExecutionResult {
	success: boolean;
	stdout?: string;
	outputFiles?: string[];
	error?: string;
	executionTime: number;
}

interface FETProcessingParams {
	htmllevel?: number;
	writetimetableconflicts?: boolean;
	writetimetablesstatistics?: boolean;
	writetimetablesxml?: boolean;
	writetimetablesdayshorizontal?: boolean;
	writetimetablesdaysvertical?: boolean;
	writetimetablestimehorizontal?: boolean;
	writetimetablestimevertical?: boolean;
	writetimetablessubgroups?: boolean;
	writetimetablesgroups?: boolean;
	writetimetablesyears?: boolean;
	writetimetablesteachers?: boolean;
	writetimetablesteachersfreeperiods?: boolean;
	writetimetablesrooms?: boolean;
	writetimetablessubjects?: boolean;
	writetimetablesactivitytags?: boolean;
	writetimetablesactivities?: boolean;
	exportcsv?: boolean;
}

export class FETDockerService {
	private containerName = 'eddi-fet-1';

	/**
	 * Stream file buffer directly to Docker container without using local filesystem
	 */
	async streamFileToContainer(targetPath: string, data: Buffer): Promise<void> {
		return new Promise((resolve, reject) => {
			// Properly escape the path for shell
			const escapedPath = targetPath.replace(/'/g, "'\\''");

			const dockerProcess = spawn('docker', [
				'exec',
				'-i',
				this.containerName,
				'sh',
				'-c',
				`cat > '${escapedPath}'`
			]);

			let stderr = '';
			let stdout = '';

			dockerProcess.stderr.on('data', (chunk) => {
				stderr += chunk.toString();
			});

			dockerProcess.stdout.on('data', (chunk) => {
				stdout += chunk.toString();
			});

			dockerProcess.on('error', (error) => {
				reject(new Error(`Failed to spawn docker process: ${error.message}`));
			});

			dockerProcess.on('close', (code) => {
				if (code === 0) {
					resolve();
				} else {
					reject(
						new Error(
							`Docker process exited with code ${code}. Path: ${targetPath}, stderr: ${stderr}, stdout: ${stdout}`
						)
					);
				}
			});

			dockerProcess.stdin.write(data);
			dockerProcess.stdin.end();
		});
	}

	/**
	 * Create directory in container
	 */
	async createDirectory(dirPath: string): Promise<void> {
		await execAsync(`docker exec ${this.containerName} mkdir -p ${dirPath}`, {
			timeout: 60000
		});
	}

	/**
	 * Execute FET command in container with custom parameters
	 */
	async executeFET(
		inputFilePath: string,
		outputDir: string,
		params: FETProcessingParams = {}
	): Promise<FETExecutionResult> {
		const startTime = Date.now();

		const defaultParams = {
			htmllevel: 7,
			writetimetableconflicts: true,
			writetimetablesstatistics: true,
			writetimetablesxml: true,
			writetimetablesdayshorizontal: true,
			writetimetablesdaysvertical: true,
			writetimetablestimehorizontal: true,
			writetimetablestimevertical: true,
			writetimetablessubgroups: true,
			writetimetablesgroups: true,
			writetimetablesyears: true,
			writetimetablesteachers: true,
			writetimetablesteachersfreeperiods: true,
			writetimetablesrooms: true,
			writetimetablessubjects: true,
			writetimetablesactivitytags: true,
			writetimetablesactivities: true,
			exportcsv: true,
			...params
		};

		const cmdStr = Object.entries(defaultParams)
			.map(([key, value]) => `--${key}=${value}`)
			.join(' ');

		const command = `docker exec ${this.containerName} fet-cl --inputfile="${inputFilePath}" --outputdir="${outputDir}" ${cmdStr}`;

		try {
			const { stdout } = await execAsync(command, {
				timeout: 20 * 60 * 1000 // 20 minutes
			});

			return {
				success: true,
				stdout,
				executionTime: Date.now() - startTime
			};
		} catch (error) {
			const execError = error as { stdout?: string; message?: string };
			return {
				success: false,
				error: execError?.stdout || 'Unknown error',
				executionTime: Date.now() - startTime
			};
		}
	}

	/**
	 * List all files in a directory in the container
	 */
	async listFiles(dirPath: string): Promise<string[]> {
		const { stdout } = await execAsync(
			`docker exec ${this.containerName} find ${dirPath} -type f`,
			{ timeout: 60000 }
		);
		return stdout.trim().split('\n').filter(Boolean);
	}

	/**
	 * Read file content from container
	 */
	async readFile(filePath: string): Promise<string> {
		const { stdout } = await execAsync(`docker exec ${this.containerName} cat "${filePath}"`, {
			timeout: 2 * 60 * 1000
		});
		return stdout;
	}

	/**
	 * Remove file from container
	 */
	async removeFile(filePath: string): Promise<void> {
		try {
			await execAsync(`docker exec ${this.containerName} rm -f ${filePath}`, {
				timeout: 60000
			});
		} catch (error) {
			console.warn(`⚠️  Failed to remove file ${filePath}:`, error);
		}
	}

	/**
	 * Remove directory from container
	 */
	async removeDirectory(dirPath: string): Promise<void> {
		try {
			await execAsync(`docker exec ${this.containerName} rm -rf ${dirPath}`, {
				timeout: 60000
			});
		} catch (error) {
			console.warn(`⚠️  Failed to remove directory ${dirPath}:`, error);
		}
	}

	/**
	 * Check if FET container is running
	 */
	async isContainerRunning(): Promise<boolean> {
		try {
			const { stdout } = await execAsync(
				`docker inspect -f '{{.State.Running}}' ${this.containerName}`
			);
			return stdout.trim() === 'true';
		} catch (error) {
			console.error('Error checking container status:', error);
			return false;
		}
	}

	/**
	 * Clean up all timetable working directories
	 */
	async cleanupTimetableWorkspace(): Promise<void> {
		try {
			await execAsync(`docker exec ${this.containerName} rm -rf /app/timetables/*`, {
				timeout: 60000
			});
		} catch (error) {
			console.warn(`⚠️  Failed to cleanup timetable workspace:`, error);
		}
	}
}
