import { pgGenerate } from 'drizzle-dbml-generator';
import * as schema from './schema/index.js';

const out = './docs/diagrams/schema.dbml';

pgGenerate({ schema, out });
