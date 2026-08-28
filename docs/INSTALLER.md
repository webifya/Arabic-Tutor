# First-run Web Installer

## Purpose and boundary

The installer lets a non-technical cPanel operator bootstrap Lisan after cloning and building the application, before `DATABASE_URL` exists. The application starts in a deliberately limited mode that serves only the installer and static assets; normal database-dependent routes redirect to `/install` until completion.

This is an initial-installation mechanism, not an update system. GitHub pulls and future schema updates use a separate reviewed deployment/update process. The installer never performs Git operations and exposes no shell/SQL command endpoint.

## Deployment flow

```text
GitHub repository
  → cPanel Setup Node.js App / Passenger
  → npm install + production build
  → start server.cjs
  → browser opens /install
  → test cPanel MySQL/MariaDB
  → fixed Prisma migrations
  → transactional base seed + super-admin
  → admin login
```

## Private runtime configuration

The default file is `<application-root>/.runtime-config.json`. It is outside `public`, ignored by Git, written atomically, and assigned mode `0600` where the filesystem supports POSIX permissions. Its parent runtime directory is private. The optional trusted environment variable `LISAN_RUNTIME_CONFIG_PATH` may move it outside the repository; browser input can never choose a path.

The file contains:

- explicit installation state and installation ID;
- the URL-encoded MySQL connection URL after final confirmation;
- generated `AUTH_SECRET`;
- generated 32-byte `APP_ENCRYPTION_KEY`;
- safe failure code and update timestamp.

Precedence is field-by-field:

1. cPanel/process environment variables;
2. private runtime configuration;
3. non-secret application defaults.

Therefore `DATABASE_URL`, `AUTH_SECRET`, and `APP_ENCRYPTION_KEY` supplied through cPanel override persisted values. Do not expose or serve the runtime file. Back it up as a secret alongside the database; losing its encryption key makes stored provider credentials unreadable.

## Wizard flow

1. **Welcome:** checks supported Node.js, private configuration writability, generated bootstrap secrets, storage writability, MySQL/MariaDB driver availability, and the fixed Prisma migration runner.
2. **Database:** accepts validated host, port, database, username, and password; builds the URL server-side with encoded credentials; performs a bounded parameter-free connection test. The browser password field is cleared after success.
3. **Application:** saves site name, tagline, canonical URL, locale, timezone, and administrator contact email in a private server draft.
4. **Administrator:** validates a 12+ character mixed password and immediately derives a salted scrypt hash. Plaintext is neither persisted nor returned.
5. **AI:** optional. Tests a bounded provider models endpoint and immediately AES-256-GCM encrypts the credential. OpenAI, Gemini, Claude, and HTTPS OpenAI-compatible endpoints are supported. Custom endpoints reject local/private/metadata targets and redirects.
6. **Voice:** optional presets are available only for installer-supported TTS providers. The selected preset becomes the default profile record but remains disabled until a real provider voice ID is validated in the later Admin phase; the installer never guesses a voice ID.
7. **Install:** shows a redacted summary, acquires an exclusive lock, retests the database, executes the fixed `prisma migrate deploy` operation, seeds base records in a transaction, creates the super-admin, and records completion in both MySQL and runtime state.
8. **Complete:** links to the authenticated admin landing page and student site.

## Installation states

`not_started`, `configuring`, `migrating`, `seeding`, `creating_admin`, `completed`, and `failed` are explicit runtime states. MySQL also stores `installation.completed`. A non-complete runtime state can self-heal to complete when the database record proves that the final transaction committed.

After completion, direct `/install` access redirects to admin login. Reinstallation is not exposed. A reset requires an explicit operator recovery procedure involving backups and both state stores; deleting only one marker is intentionally insufficient.

## Security controls

- Next.js Server Actions provide same-origin CSRF enforcement; every action additionally validates untrusted input with Zod and rechecks installation state.
- Database tests, provider tests, installer starts, and final attempts are rate-limited using private server files.
- Final installation uses an exclusive `wx` lock with bounded stale-lock recovery.
- Database work uses driver connections and parameterized statements. Credentials never enter a shell command or command argument.
- Prisma migration execution uses `process.execPath`, a fixed local CLI path, fixed arguments, a timeout, and `DATABASE_URL` only in the child environment.
- Provider credentials are encrypted immediately; database/admin passwords are never logged or returned.
- Production errors are generic. Draft and runtime filenames are derived only from server-generated random identifiers.
- Custom provider URLs use HTTPS, DNS/IP validation, redirect rejection, and private-network blocking.

File-backed limits and locks fit the initial single cPanel/Passenger application root. Before horizontally scaling, replace them with a shared durable coordination service.

## Failure and recovery

Safe retry is available when the state is `failed`. Prisma deploy is migration-aware and can resume unapplied migrations; base seeding occurs in one database transaction after migrations. DDL changes may already exist after a later failure, so never delete tables manually. Correct the cPanel/database/runtime issue and retry through the predefined operation.

If a lock remains after a crashed process, it becomes recoverable after 15 minutes. For persistent failure, preserve `.runtime-config.json`, capture redacted cPanel logs, verify database backup/access, and follow a reviewed operator recovery procedure. Never paste the runtime file or database URL into a public issue.

## Build and dependency requirement

The browser installer invokes the locally installed Prisma CLI. cPanel must install development dependencies during build/deployment (`npm ci`, not `npm ci --omit=dev`) and retain the application root `node_modules/prisma` directory. A standalone release archive must include the source application root and migration files as described in `docs/DEPLOY-CPANEL.md`; the minimal standalone server bundle alone is insufficient for a fresh browser installation.
