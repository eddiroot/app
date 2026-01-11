# Schema Creation

When creating schemas you need to add the schema name in two locations:

1. migrations/0001_schemas.sql
2. drizzle.config.ts

When in production ensure that when creating a new schema it is added to a new migration not 0001_schemas.sql

See [this issue](https://github.com/drizzle-team/drizzle-orm/issues/3476) for more details
