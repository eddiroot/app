# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development setup

```bash
docker compose -f docker-compose.dev.yml up -d   # postgres + minio + fet container
npm install
npm run db:push                                  # apply schema to dev db
npm run db:seed                                  # seed eddi platform + Demo school data
npm run dev
```

To fully reset, `docker compose ... down --volumes` then re-run the setup.

### Day-to-day

- `npm run dev` — Vite dev server
- `npm run check` — `svelte-kit sync` + `svelte-check` (type/diagnostic check, run before committing non-trivial changes)
- `npm run lint` — Prettier check + ESLint
- `npm run format` — Prettier write
- `npm run build` / `npm run preview` — production build (uses `@sveltejs/adapter-node`)

### Database

- `npm run db:push` — push schema directly (preferred in dev)
- `npm run db:generate` — generate a new migration from schema diff
- `npm run db:migrate` — apply migrations
- `npm run db:studio` — Drizzle Studio
- `npm run db:diagram` — regenerate DBML diagram via `src/lib/server/db/dbml.ts`
- `npm run db:seed` — runs `src/lib/server/db/seed/index.ts`; truncates all tables, then seeds eddi (curriculum etc.) followed by Demo school

The seeder supports a SQL-file convention: if a `.sql` file exists alongside a `.ts` seeder with the same name, it runs instead of the TS code. See `src/lib/server/db/seed/README.md`.

### Adding shadcn-svelte components

```bash
npx shadcn-svelte@latest add component-name-here
```

Aliases (see `components.json`): `$lib/components`, `$lib/components/ui`, `$lib/utils/ui`, `$lib/hooks`.

## Architecture

### Stack

SvelteKit 2 + Svelte 5 (runes) + TypeScript, Drizzle ORM on PostgreSQL (pgvector image), MinIO for object storage, Tailwind v4 with shadcn-svelte components, Vite 7. Adapter is `@sveltejs/adapter-node` (Dockerfile in `app.Dockerfile`).

### Multi-schema PostgreSQL via Drizzle

The database is split across PostgreSQL **schemas** (not just tables): `public`, `curriculum`, `event`, `news`, `resource`, `school`, `subject`, `task`, `timetable`, `user`. Each is declared with `pgSchema(...)` in its file under `src/lib/server/db/schema/`.

**When you add a new pg schema, you MUST update two places** (per `src/lib/server/db/schema/00-IMPORTANT.md`):

1. `migrations/0001_schemas.sql` (in dev — in production add a new migration instead)
2. `schemaFilter` array in `drizzle.config.ts`

Otherwise `drizzle-kit push` will not see the schema. See [drizzle-orm#3476](https://github.com/drizzle-team/drizzle-orm/issues/3476).

### Database conventions (`docs/agentbrief.md`)

- Use `onDelete: 'cascade'` by default on foreign keys.
- Prefix Drizzle pgEnum names with `enum_`.
- If a camelCase TS column name maps to the same name in snake_case, **omit** the explicit column-name string (e.g. `countryCode: varchar({ length: 2 })`, not `varchar('country_code', ...)`).
- Always add an `index()` on foreign keys and `uniqueIndex()` on uniqueness rules.
- Junction tables: composite primary key on the two FK columns (no separate id), spread `essentialsNoId` from `schema/utils.ts`.
- Common helpers in `schema/utils.ts`: `idINT` / `idUUID`, `essentials`, `essentialsUUID`, `essentialsNoId`, `standardTimestamp`, `timestamps`, `enumToPgEnum`. Schools use **local time without timezone** — `standardTimestamp` is configured this way deliberately.

### Server/client separation

A recent refactor (commits `f2f960c`, `7e06af1a`) explicitly separated server and client code; respect this:

- Anything that touches the DB, OAuth, MinIO, FET, email, or env secrets lives under `src/lib/server/`. SvelteKit will refuse to bundle it client-side.
- DB queries belong in `src/lib/server/db/service/` modules — **never put DB calls directly in `+page.server.ts`** files. Page loads/actions should call service functions.
- Shared client/server pure utils go in `src/lib/utils/`. Zod schemas shared between client forms and server actions go in `src/lib/schema/`.

### Auth & RBAC

- `src/hooks.server.ts` resolves the session cookie on every request. If unauthenticated and the route isn't `/` or under `(public)`, it 303s to `/login`.
- `event.locals.user`, `event.locals.session`, `event.locals.security` are populated for every request; types are declared in `src/app.d.ts`.
- `src/lib/server/security.ts` exposes a chainable `Security` class for route-level checks: `locals.security.isAuthenticated().isTeacher()` etc. User types are in `userTypeEnum` (`src/lib/enums.ts`): `student`, `guardian`, `teacher`, `staff`, `principal`, `admin`. Permissions per role are derived in `src/lib/utils/permissions.ts`.
- OAuth (Google + Microsoft) via `arctic` lives in `src/lib/server/auth/oauth.ts`. Sessions are custom (cookie + DB), not Lucia. **Note**: there is currently a static school ID used during OAuth that needs replacing — search for `TODO` references when touching that code.

### Routing

File-based via SvelteKit. Top-level groups under `src/routes/`:

- `(public)` — login + marketing pages, accessible without auth (the only non-`/` paths the auth hook lets through).
- `dashboard`, `attendance`, `calendar`, `grades`, `news`, `profile`, `subjects/[subjectOfferingId]/...` — authenticated app routes.
- `admin/*` — school admin only (allocations, behaviours, buildings, campuses, events, school, semesters-and-terms, spaces, subjects, timetables, users).
- `api/*` — minimal REST endpoints (`tasks`, `timetables/generate`). Prefer native forms + superforms + Zod over adding new API routes.

### Forms & UI

- Use **superforms + Zod v4** for forms; prefer native form actions over API routes.
- Use **shadcn-svelte** for all UI; if a component is missing, ask before introducing another library.
- Use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`). `LoaderData` / `Action` types do not need to be declared on Svelte pages — Svelte 5 infers them.
- Prefer `Pick` / `Omit` from existing schema-derived types (e.g. `typeof user.$inferSelect`) over redefining shapes — schema is the single source of truth.
- `@lucide/svelte` icons render at `h-4 w-4` by default; don't re-add those classes.

### Timetabling (FET)

Generation is delegated to the open-source [FET](https://lalescu.ro/liviu/fet/) tool, which runs in a sidecar Docker container (`fet.Dockerfile`, container name `eddi-fet-1`). `src/lib/server/fet/index.ts` streams input files into the container with `docker exec`, runs FET, and reads back results. The `node-cron` queue processor in `src/scripts/process/timetable.ts` is currently commented out in `hooks.server.ts`; uncomment when working on the queue. See `docs/timetabling/` for constraint design.

### Object storage

MinIO (S3-compatible) accessed via `src/lib/server/obj.ts`. Bucket `schools` is auto-created by the `obj_buckets` service in `docker-compose.dev.yml`. Use presigned URLs for client-facing asset access (see `+layout.server.ts` for the school logo pattern).

### Code style

Prettier: **tabs**, 2-wide, single quotes, 80 col, trailing commas. ESLint extends the typescript-eslint and svelte recommended sets, with `no-undef` and `svelte/no-navigation-without-resolve` disabled. Husky pre-commit hooks are configured.
