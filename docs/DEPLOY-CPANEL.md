# Deploying to cPanel / Passenger

> **Verification status:** The values in this document are general recommendations and local/CI-compatible instructions. A real cPanel staging host has not yet been supplied for verification. Use [the staging acceptance checklist](STAGING-ACCEPTANCE.md) and promote observed values here only after the operator records redacted evidence.

## Supported runtime

Use Node.js 22.12+ LTS where cPanel offers it. Node.js 20.19+ and Node.js 24 are also supported; odd-numbered releases are not production targets. Confirm the exact version and memory/process limits with the host before deployment. The app uses a standard Node runtime and Next.js `output: "standalone"`; it does not require Vercel or Edge.

## Values to prepare

- Application root, for example `/home/ACCOUNT/apps/lisan`
- Public application URL, for example `https://learn.example.com`
- Application startup file: `server.cjs`
- Production mode and all variables listed in `.env.example`
- A private, writable storage directory and a MySQL/MariaDB database/user
- SMTP details and a verified sender address when password-reset email is required

Never place secrets in the Git repository or a public web root. cPanel account names and paths vary; replace examples with the host's real values.

## Method A: cPanel UI (no SSH assumed)

1. In **Git Version Control**, clone `https://github.com/webifya/Arabic-Tutor.git` into a private application directory. If Git deployment is unavailable, upload a release archive through File Manager.
2. In **Setup Node.js App** / **Application Manager**, create a Production app, choose Node 22, set the application root and URL, and set `server.cjs` as the startup file.
3. Add environment variables in the Node application UI. Set `NEXT_PUBLIC_APP_URL` to the HTTPS production URL, `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, and use the port supplied by Passenger when one is provided.
4. Use cPanel's npm install action. If it supports a custom command, run `npm ci`.
5. Use the terminal provided by the Node app UI to run `npm run build`. If the UI cannot run build commands, build a release using the same Node version locally or in CI, then upload the repository plus `.next/standalone`, `.next/standalone/.next/static`, and `.next/standalone/public` produced by the build.
6. Restart the application from cPanel and open its HTTPS URL.

7. On a fresh installation, opening the site redirects to `/install`. Complete the database, site, super-admin, and optional provider/voice steps. No database environment variable is required before the bootstrap server starts.

The build script copies static and public assets into the standalone bundle automatically.
It uses Next.js's supported webpack production builder to avoid Turbopack worker/socket restrictions found on some shared cPanel environments.

For a fresh browser installation, retain the full application root, `prisma/migrations`, and installed Prisma CLI. Do not deploy only the minimal `.next/standalone` directory. Once installed, environment variables may override values persisted in the private runtime configuration.

## Method B: SSH

```bash
git clone https://github.com/webifya/Arabic-Tutor.git lisan
cd lisan
cp .env.example .env.local
npm ci
npm run lint
npm run typecheck
npm test
npm run build
NODE_ENV=production PORT=3000 node server.cjs
```

In production, store real variables through cPanel rather than committing `.env.local`. Configure Passenger to start `server.cjs`, then restart from cPanel or by the host-supported Passenger restart control.

If using the web installer, `DATABASE_URL`, `AUTH_SECRET`, and `APP_ENCRYPTION_KEY` may initially be absent. The installer generates/persists them in `.runtime-config.json` with restrictive permissions. Configure `LISAN_RUNTIME_CONFIG_PATH` in cPanel when the host provides a more suitable private directory. See `docs/INSTALLER.md`.

## Domain and TLS

Point the application URL/subdomain to the Node app using cPanel's domain mapping. Issue and renew an AutoSSL certificate, redirect HTTP to HTTPS at the proxy/domain layer, and set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS origin. If Auth.js is behind a reverse proxy, enable trusted-host behavior only after confirming proxy headers and the canonical host.

## Storage and permissions

The initial storage backend is a private local/cPanel directory. It must be writable by the Passenger process and not directly browsable. Serve authorized files through application endpoints or explicitly public generated-asset paths. Do not keep temporary microphone audio after processing. Back up durable media together with the database.

## Updating

1. Back up the database and durable storage.
2. Record the currently deployed commit.
3. Pull the reviewed release (or deploy its archive).
4. Run `npm ci`, `DATABASE_URL='…' npx prisma migrate deploy`, and `npm run build`.
5. Restart Passenger and run health/smoke checks.

Application updates do not reopen or rerun the first-run installer. Future updates must use the separate controlled migration process; do not delete installation state to apply an update.

For minimal downtime, build in a release directory and switch the configured application root only after validation when the host permits it.

## Rollback

Retain the previous release directory or release archive and the pre-deploy database backup. Point the app root back to the prior release (or redeploy its commit), restore the database only when migration compatibility requires it, restore matching media if needed, and restart. Never assume reversing a Prisma migration safely restores deleted data.

## Troubleshooting

- **Application does not start:** verify Node version, startup file `server.cjs`, production build presence, environment variables, and cPanel error logs.
- **Cannot find `.next/standalone/server.js`:** run `npm run build` in the application root and confirm the build completed.
- **CSS/fonts/assets return 404:** confirm `.next/standalone/.next/static` and `.next/standalone/public` exist; the build script prepares both.
- **Wrong port or 502:** let Passenger supply `PORT` when it does; do not expose an unrelated fixed port. Confirm the process binds to `0.0.0.0`.
- **Database connection fails:** check encoded credentials, database/user grants, allowed host, server version, connection limits, and whether cPanel requires `localhost` rather than `127.0.0.1`.
- **Permission denied on media:** make the configured storage directory writable by the app user without making it world-writable.
- **Reset email unavailable:** configure the `SMTP_*` variables, verify the sender/domain, restart Passenger, and test delivery without logging tokens.
- **Out of memory/build timeout:** build in CI or locally with the exact production Node version and upload the prepared standalone artifact.
- **Changes do not appear:** restart the Node application/Passenger and verify the deployed commit and application root.

The same standalone build can run on a VPS or Docker-capable server. Vercel remains optional, but core services must retain their portable provider boundaries.
