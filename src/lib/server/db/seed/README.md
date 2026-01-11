# Database Seeding

Seeds the database with initial data for development and testing.

## Usage

```bash
npm run db:seed
```

This will:

1. Truncate all existing tables
2. Seed eddi platform data (curriculum, etc.)
3. Seed Demo school data (users, subjects, timetable, news)

```

## SQL File Convention

Seeders support a convention where a `.sql` file can be used instead of the TypeScript seeder.

**How it works:**

If a `.sql` file exists with the same name as the `.ts` seeder in the same directory, the SQL file will be executed instead of the TypeScript code.

**Example:**

```

src/lib/server/db/seed/eddi/curriculum/VCAA/
├── vc2.ts # TypeScript seeder (fallback)
├── vc2.sql # SQL file (used if present)
└── index.ts

````

When `vc2.sql` exists, it will be executed directly. If it doesn't exist, `vc2.ts` will run instead.

**Creating SQL seed files:**

Use the SQL export script to generate seed files. Include `--override-id` to handle identity columns:

```bash
npm run sql:export -- schema curriculum --override-id --output=./src/lib/server/db/seed/eddi/curriculum/VCAA
````

This creates a `curriculum.sql` file. Rename it to match the seeder (e.g., `vc2.sql`) to use it.
