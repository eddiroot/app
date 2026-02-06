import { csvSchema } from '$lib/schema/resource';
import { z } from 'zod';

export const requiredColumns = ['name', 'type', 'buildingName'];
export const optionalColumns: string[] = ['capacity', 'description'];

export const locationsImportSchema = z.object({ file: csvSchema });

export type LocationsImportSchema = typeof locationsImportSchema;
