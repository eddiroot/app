import { subjectGroupEnum } from '$lib/enums';
import { z } from 'zod';

// =================================================================
// Subject Schemas
// =================================================================
export const subjectGroupOutputSchema = z.object({
	subjectGroup: z.nativeEnum(subjectGroupEnum).describe('The subject group the subject belongs to.')
});

export type SubjectGroupOutput = z.infer<typeof subjectGroupOutputSchema>;
