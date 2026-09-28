# Consilium

Consilium is a permission-controlled file library built with Next.js. People sign in with Discord, and their access is assigned from a Google Sheets directory. The app stores file metadata and access rules in PostgreSQL and stores file contents through a storage interface (local disk by default).

## What it does

- Authenticates users with Discord through Better Auth.
- Syncs directory positions from Google Sheets and maps those positions to roles.
- Uses role permissions for system actions and role assignments on each file for file access.
- Supports file versions, soft deletion, and an audit trail of important actions.

`READ_ALL` grants access across file-level role restrictions and to hidden versions. Treat it, `ADMINISTRATOR`, and `AUDIT_VIEW` as sensitive permissions.

## Requirements

- Node.js and npm
- Docker with Docker Compose, or a reachable PostgreSQL database
- A Discord application configured for OAuth
- A Google service account with read access to the directory spreadsheets, if directory sync is used

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file and configure it:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DISCORD_CLIENT_ID`, and `DISCORD_CLIENT_SECRET`. Generate a secret with `openssl rand -base64 32`. Configure the Discord OAuth callback URL for your local Better Auth setup (`http://localhost:3000/api/auth/callback/discord`).

   For the included PostgreSQL service, set `POSTGRES_PASSWORD` in `.env` and use matching credentials in `DATABASE_URL`, for example `postgresql://consilium:<password>@localhost:5432/consilium`.

3. Start PostgreSQL and prepare the database:

   ```bash
   docker compose up -d
   npm run db:generate
   npm run db:migrate
   ```

   `npm run db:seed` is optional and adds the development seed data. `npm run db:clean` deletes database data; use it only when that is intended.

4. If using directory sync, configure `SPREADSHEET_IDS` as a comma-separated list of spreadsheet IDs. The Google Sheets integration reads the `rawData!A1:B` range and expects position in column A and Discord ID in column B. Place a Google service account key at the project root as `credentials.json`, and share the spreadsheets with that service account. Keep this credential file private and out of version control.

5. Start the application:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Configuration

See [.env.example](.env.example) for the supported variables:

| Variable                                            | Purpose                                                                  |
|-----------------------------------------------------|--------------------------------------------------------------------------|
| `DATABASE_URL`                                      | PostgreSQL connection string used by Prisma.                             |
| `BETTER_AUTH_SECRET`                                | Secret used by Better Auth.                                              |
| `BETTER_AUTH_URL`                                   | Base URL of this application.                                            |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`        | Discord OAuth application credentials.                                   |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credentials and database name for the Compose PostgreSQL service.        |
| `SPREADSHEET_IDS`                                   | Comma-separated Google Sheets IDs for directory sync.                    |
| `FILE_STORAGE_PATH`                                 | Local directory for uploaded file contents (defaults to `./data/files`). |
| `MAX_FILE_SIZE`                                     | Upload size limit in bytes.                                              |
| `CRON_SECRET`                                       | Secret used to authenticate cron jobs.                                   |

The Google service account key is read from `credentials.json`; it is not an environment variable in the current implementation.

## Project layout

- `app/` — App Router pages and API routes
- `components/` — shared React components
- `lib/` — authentication, permissions, file operations, directory sync, audit, and storage
- `prisma/` — database schema, migrations, and seed/maintenance scripts
- `public/` — static assets

For contribution workflow and code principles, see [CONTRIBUTING.md](CONTRIBUTING.md).
