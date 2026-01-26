import type { SeedContext } from '../types';
import { seedEddiSchool } from './school';

export async function seedEddi(context: SeedContext) {
	const { db } = context;
	const eddi = await seedEddiSchool(db);
	return { eddi };
}
