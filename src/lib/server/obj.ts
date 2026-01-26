import { env } from '$env/dynamic/private';
import * as Minio from 'minio';

if (!env.OBJ_URL_PREFIX) throw new Error('OBJ_URL_PREFIX is not set');
if (!env.OBJ_ENDPOINT) throw new Error('OBJ_ENDPOINT is not set');
if (!env.OBJ_PORT) throw new Error('OBJ_PORT is not set');
if (!env.OBJ_USE_SSL) throw new Error('OBJ_USE_SSL is not set');
if (!env.OBJ_ACCESS_KEY) throw new Error('OBJ_ACCESS_KEY is not set');
if (!env.OBJ_SECRET_KEY) throw new Error('OBJ_SECRET_KEY is not set');

const minioClient = new Minio.Client({
	endPoint: env.OBJ_ENDPOINT,
	port: parseInt(env.OBJ_PORT, 10),
	useSSL: env.OBJ_USE_SSL === 'true',
	accessKey: env.OBJ_ACCESS_KEY,
	secretKey: env.OBJ_SECRET_KEY,
});

const BUCKET_NAME = 'schools';

async function uploadBuffer(
	objectName: string,
	buffer: Buffer,
	contentType?: string,
) {
	try {
		const metaData = contentType ? { 'Content-Type': contentType } : {};
		const res = await minioClient.putObject(
			BUCKET_NAME,
			objectName,
			buffer,
			buffer.length,
			metaData,
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
	contentType?: string,
): Promise<string> {
	await uploadBuffer(objectName, buffer, contentType);
	return `${env.OBJ_URL_PREFIX}/${BUCKET_NAME}/${objectName}`;
}

export async function deleteFile(objectName: string): Promise<void> {
	try {
		await minioClient.removeObject(BUCKET_NAME, objectName);
	} catch (error) {
		console.error('Error deleting file:', error);
		throw error;
	}
}

export async function listFiles(
	bucketName: string,
	prefix?: string,
): Promise<string[]> {
	try {
		const objects: string[] = [];
		const stream = minioClient.listObjects(bucketName, prefix, true);

		return new Promise((resolve, reject) => {
			stream.on('data', (obj) => {
				if (obj.name) {
					objects.push(obj.name);
				}
			});
			stream.on('error', reject);
			stream.on('end', () => resolve(objects));
		});
	} catch (error) {
		console.error('Error listing files:', error);
		throw error;
	}
}

export async function getPresignedUrl(
	schoolId: string,
	objectName: string,
	expiry: number = 5 * 60, // 5 minutes in seconds
): Promise<string> {
	const fullObjectName = `${schoolId}/${objectName}`;

	try {
		const url = await minioClient.presignedGetObject(
			BUCKET_NAME,
			fullObjectName,
			expiry,
		);
		return url;
	} catch (error) {
		console.error('Error generating presigned URL:', error);
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
