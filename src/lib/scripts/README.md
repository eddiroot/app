# Scripts

Utility scripts for database operations and data processing.

## Embedding Script

Generates vector embeddings for database tables that support semantic search.

```bash
npm run embed:schema
```

For more options:

```bash
npm run embed:schema -- --help
```

## SQL Export Script

Exports database tables to SQL files for seeding or backup purposes.

```bash
npm run sql:export
```

For more options and usage examples:

```bash
npm run sql:export -- --help
```

### ID Offset Feature

When exporting SQL for different curricula, use `--id-offset` to avoid ID conflicts:

```bash
# Export with offset to avoid ID collisions
npm run sql:export -- schema curriculum --id-offset=100000 --override-id  --output=./data/sql-exports/curriculum-v2
```

Note: `school_id` is never shifted by the offset to maintain consistency across exports.
