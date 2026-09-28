# Contributing

Thanks for helping improve Consilium. Keep changes focused, follow the patterns around the code you are changing, and make security behavior clear in the pull request.

## Before you start

- Check existing routes, server actions, and nearby `lib/` modules before adding a new path for the same behavior.
- For larger changes, open or discuss an issue first so the intended behavior is clear.
- Do not commit `.env`, `credentials.json`, OAuth credentials, database dumps, or uploaded files.

## Development setup

Follow the [README local development instructions](README.md#local-development). In short, configure `.env`, start PostgreSQL with `docker compose up -d`, then run:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Use `npm run db:seed` only if you want the seed data. The cleanup command `npm run db:clean` removes data and is not part of routine setup.

## Project structure

- `app/` contains Next.js App Router pages and API handlers.
- `components/` contains reusable UI.
- `lib/` contains server-side domain logic, authorization, storage, sync, and auditing.
- `prisma/` contains the schema, migrations, and database scripts.

Trace a feature through the page or API route, its component or server action, and the relevant `lib/` code before changing it. Keep privileged operations on the server.

## Implementation principles

### Authorization and identity

- Enforce permissions on the server for every protected read or mutation; hiding a control in the UI is not authorization.
- Users authenticate through Discord. Directory entries synced from Google Sheets assign roles according to `Role.sheetsTriggers`.
- Consider both system permissions and file-level role access. `READ_ALL` bypasses file-level access checks and can see hidden versions. Handle it carefully.
- Do not let directory sync grant access to the `SYSTEM` user or make assumptions that a user is in the directory.

### Files, storage, and database changes

- PostgreSQL stores metadata; use the `FileStorage` interface for file bytes. Keep existing storage keys stable and do not put file contents in database records.
- Validate input at server boundaries. When changing file operations, preserve checks for permissions, file access, size limits, and soft-deleted records.
- Use Prisma transactions when a mutation updates related records. Add or update migrations for schema changes and review generated SQL before applying it.
- Keep the Better Auth models in `prisma/schema.prisma` aligned with Better Auth; the schema marks those models as managed integration models.

### Audit trail

- Audit security-relevant actions using the existing helpers in `lib/audit/`.
- Include the actor, action, affected targets, and useful before/after values where appropriate. Do not put secrets, bearer tokens, or file bytes into audit metadata.

### Style

- Use TypeScript, two-space indentation, and the surrounding files' quote and semicolon conventions.
- Use PascalCase for components and types, descriptive lowercase names for library modules, and `kebab-case.tsx` for component files.
- Follow existing Next.js patterns. This repository uses a modified Next.js release; before changing Next.js APIs or conventions, consult the relevant guide under `node_modules/next/dist/docs/` and check deprecation notes.

## Database and sync changes

For Prisma schema changes, update the schema, create and review a migration, and regenerate the client:

```bash
npm run db:migrate
npm run db:generate
```

For permission or directory-sync changes, consider how the change affects both new and existing users. Directory sync reads the configured sheets and recalculates roles, so changes to its inputs or matching behavior can alter access assignments.

## Checks before opening a pull request

Run the checks relevant to your change:

```bash
npm run lint
npm run build
```

Also manually check the affected flow as a user who should be allowed and a user who should be denied. For UI changes, include screenshots where they help reviewers. If a check cannot be run, say why in the pull request.

## Pull requests

- Keep each pull request focused and explain the user-visible or operational effect.
- Link the related issue when one exists.
- Call out migrations, new environment variables, or setup steps.
- Include screenshots for meaningful UI changes.
- Note checks performed and any known limitations.

Commit subjects commonly use focused prefixes such as `feat:`, `fix:`, and `chore:`.
