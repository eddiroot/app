# Repository Guidelines

## Project Structure & Module Organization

eddi is a SvelteKit and TypeScript application. Route pages, layouts, server loads, and API handlers live in `src/routes`; keep route-specific schemas and helpers beside the route that uses them. Shared UI and client utilities live in `src/lib/components`, `src/lib/hooks`, `src/lib/utils`, and `src/lib/assets`. Server-only code belongs under `src/lib/server`, including database, email, auth, and FET timetable integration. Migrations are in `migrations`, public files are in `static`, and longer-form notes are in `docs` and `zmax_docs`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite/SvelteKit development server.
- `npm run build`: create a production build.
- `npm run preview`: preview the production build locally.
- `npm run check`: run `svelte-check` with the project TypeScript config.
- `npm run lint`: run Prettier in check mode and ESLint.
- `npm run format`: format the repository with Prettier.
- `npm run db:up` / `npm run db:down`: start or reset the development Docker database.
- `npm run db:push`, `npm run db:migrate`, `npm run db:generate`: apply or generate Drizzle database changes.
- `npm run db:seed` / `npm run db:studio`: seed local data or open Drizzle Studio.

## Coding Style & Naming Conventions

Use TypeScript, Svelte 5, and SvelteKit conventions. Formatting is controlled by Prettier with Svelte and Tailwind plugins. Name Svelte components in PascalCase, route files with names such as `+page.svelte` and `+server.ts`, and colocated validation files as `schema.ts`. Keep server-only imports inside `src/lib/server` or server route modules.

## Testing Guidelines

There is no dedicated test runner configured yet. Treat `npm run check`, `npm run lint`, and `npm run build` as the required verification set before opening a PR. For database work, also run the relevant Drizzle command and validate seed data. If tests are added, prefer colocated `*.test.ts` files near the module under test.

## Commit & Pull Request Guidelines

Recent history uses concise Conventional Commit-style prefixes, mainly `fix:` and `feat:`. Follow that pattern, for example `fix: handle timetable draft ordering` or `feat: add attendance export`. PRs should include a short description, linked issue when available, verification commands, and screenshots for UI changes. Call out migrations, seed changes, and required environment variables.

## Security & Configuration Tips

Copy `.env.example` for local configuration and keep secrets out of git. Use the Docker development database locally. Review changes under `src/lib/server/security.ts`, auth modules, and database schema files carefully.
