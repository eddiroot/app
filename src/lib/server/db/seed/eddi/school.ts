import * as schema from '../../schema';
import type { Database } from '../types';

export async function seedEddiSchool(db: Database) {
    const [eddiSchool] = await db
        .insert(schema.school)
        .values({
            name: 'eddi.edu.au',
            countryCode: 'AU',
            stateCode: 'VIC'
        })
        .returning();
    return eddiSchool;
}