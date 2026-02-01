import { z } from 'zod';

export const rsvpSchema = z.object({ willAttend: z.boolean() });
