import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resource } from 'sst';

const client = new S3Client({});

let _bucketName: string | null = null;
function getBucketName(): string {
	if (!_bucketName) {
		_bucketName = Resource.BucketSchools.name;
	}
	return _bucketName;
}

async function uploadBuffer(objectName: string, buffer: Buffer, contentType?: string) {
	try {
		const res = await client.send(
			new PutObjectCommand({
				Bucket: getBucketName(),
				Key: objectName,
				Body: buffer,
				ContentType: contentType
			})
		);
		return res;
	} catch (error) {
		console.error('Error uploading buffer:', error);
		throw error;
	}
}

export async function uploadBufferHelper(
	buffer: Buffer,
	objectName: string,
	contentType?: string
): Promise<string> {
	await uploadBuffer(objectName, buffer, contentType);
	return `https://${getBucketName()}.s3.amazonaws.com/${objectName}`;
}

export async function deleteFile(objectName: string): Promise<void> {
	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: getBucketName(),
				Key: objectName
			})
		);
	} catch (error) {
		console.error('Error deleting file:', error);
		throw error;
	}
}

export async function listFiles(prefix?: string): Promise<string[]> {
	try {
		const objects: string[] = [];
		let continuationToken: string | undefined;

		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: getBucketName(),
					Prefix: prefix,
					ContinuationToken: continuationToken
				})
			);

			if (response.Contents) {
				for (const obj of response.Contents) {
					if (obj.Key) {
						objects.push(obj.Key);
					}
				}
			}

			continuationToken = response.NextContinuationToken;
		} while (continuationToken);

		return objects;
	} catch (error) {
		console.error('Error listing files:', error);
		throw error;
	}
}

export async function getPresignedUrl(
	schoolId: string,
	objectName: string,
	expiry: number = 7 * 24 * 60 * 60 // 7 days in seconds
): Promise<string> {
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const command = new GetObjectCommand({
			Bucket: getBucketName(),
			Key: fullObjectName
		});
		const url = await getSignedUrl(client, command, { expiresIn: expiry });
		return url;
	} catch (error) {
		console.error('Error generating presigned URL:', error);
		throw error;
	}
}

export async function getFileFromStorage(
	schoolId: string,
	timetableId: string,
	timetableDraftId: string,
	objectName: string,
	input: boolean
) {
	const dir = input ? 'input' : 'output';

	// Use draft structure if provided, otherwise fall back to old structure
	const fullObjectName = timetableDraftId
		? `${schoolId}/${timetableId}/${timetableDraftId}/${dir}/${objectName}`
		: `${schoolId}/${timetableId}/${dir}/${objectName}`;

	try {
		const response = await client.send(
			new GetObjectCommand({
				Bucket: getBucketName(),
				Key: fullObjectName
			})
		);

		// Convert stream to buffer
		if (!response.Body) {
			throw new Error('No body in response');
		}

		const chunks: Uint8Array[] = [];
		for await (const chunk of response.Body as any) {
			chunks.push(chunk);
		}
		return Buffer.concat(chunks);
	} catch (error) {
		console.error('Error getting file from storage:', error);
		throw error;
	}
}

export function generateUniqueFileName(originalName: string): string {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 8);
	const extension = originalName.split('.').pop();
	const baseName = originalName.split('.').slice(0, -1).join('.');
	return `${baseName}_${timestamp}_${randomString}.${extension}`;
}
