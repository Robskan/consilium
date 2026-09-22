# Repository Guidelines

## Project Structure

This Next.js App Router application keeps routes and API handlers in `app/`, reusable React components in `components/`, and static assets in `public/`. Server-side logic is in `lib/`: `files/` handles file/version operations, `permissions.ts` checks authorization, `storage/` stores bytes, `audit/` records actions, and `sync.ts` reconciles directory and user roles. Prisma schema, migrations, and seed/maintenance scripts are in `prisma/`.

## Architecture and Project Principles

Consilium is a permission-controlled file library. Users authenticate with Discord through Better Auth. Discord IDs are matched to a local directory synced from Google Sheets; directory positions map to roles through `Role.sheetsTriggers`. Roles grant system permissions and, separately, access to files. A file may require multiple roles; `READ_ALL` bypasses that file-level check. Hidden versions are intended for `READ_ALL` users. Records with `deletedAt` are soft-deleted.

Prisma stores metadata in PostgreSQL; file bytes use the `FileStorage` interface (currently local disk). Keep storage keys stable and bytes out of database records. Mutations should validate input, enforce permission and file access on the server, record audit events, and transact related database changes. Audit entries capture the actor, action, targets, and optional before/after values. Keep Better Auth models aligned with Better Auth.

## Development Workflow

1. Copy `.env.example` to `.env`; set `DATABASE_URL`, Better Auth settings, and Discord OAuth credentials. `SPREADSHEET_IDS` configures Sheets sync; `FILE_STORAGE_PATH` and `MAX_FILE_SIZE` configure uploads.
2. Run `docker compose up -d`, `npm run db:generate`, and `npm run db:migrate`. Use `npm run db:seed` only when seed data is wanted.
3. Run `npm run dev`. Trace features from `app/` through their component/server action into `lib/` and Prisma or storage. Keep privileged work on the server.
4. For schema changes, review the migration SQL and regenerate the client. For permission or sync changes, consider both access decisions and existing users' role updates.
5. Run `npm run lint` and `npm run build`, then manually check the changed flow as an allowed and denied user.

## Development Commands

- `npm run dev` starts the local Next.js development server.
- `npm run build` creates a production build; `npm start` serves that build.
- `npm run lint` runs ESLint across the project.
- `npm run db:generate` regenerates the Prisma client after schema changes.
- `npm run db:migrate` applies a development migration; `npm run db:studio` opens Prisma Studio.
- `npm run db:seed` seeds configured data, and `npm run db:clean` runs the project cleanup script.

Use the intended local `DATABASE_URL` and keep credentials out of commits. `app/api/cron/sync-directory/route.ts` triggers Sheets sync and refreshes existing user roles; changes to its inputs affect access assignments.

## Coding Style

Use TypeScript, two-space indentation, and existing semicolon/quote conventions. Name components and types in PascalCase; use `kebab-case.tsx` for component files and descriptive lowercase library names. Recheck authorization server-side even when the UI hides an action. Run `npm run lint`. This repository uses a modified Next.js release: before changing Next.js APIs or conventions, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Testing

No automated test framework or coverage threshold is configured. Run lint/build and manually check the affected route or workflow. If adding tests, use clear names and document how to run them.

## Commits and Pull Requests

Recent commits use focused prefixes such as `feat:`, `fix:`, and `chore:`, sometimes followed by an issue/PR number. Pull requests should explain the change, link an issue, note database/configuration steps, include screenshots for UI changes, and identify migrations or new environment variables.
