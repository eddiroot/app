import { csvSchema } from '$lib/schema/resource'
import { z } from 'zod'

export const requiredColumns = ['name', 'campusName']
export const optionalColumns: string[] = ['description']

export const buildingsImportSchema = z.object({ file: csvSchema })

export type BuildingsImportSchema = typeof buildingsImportSchema
