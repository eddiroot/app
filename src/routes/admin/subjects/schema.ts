import { csvSchema } from '$lib/schema/resource'
import { z } from 'zod'

export const requiredColumns = ['name', 'yearLevel']
export const optionalColumns: string[] = ['description']

export const subjectsImportSchema = z.object({ file: csvSchema })

export type SubjectsImportSchema = typeof subjectsImportSchema
