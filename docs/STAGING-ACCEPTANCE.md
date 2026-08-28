# cPanel Staging Acceptance Checklist

## Status and evidence rule

**Current status: NOT YET VERIFIED ON CPANEL STAGING.**

This runbook is for a disposable staging domain, database, storage directory, SMTP account, super-admin, and learner account. Never place their real values in Git, screenshots, issue trackers, or this document. Record redacted evidence in the deployment ticket. A check is not `PASS` until the operator observes it on the real cPanel host.

Required operator access:

- cPanel Git/Files, Setup Node.js App/Application Manager, environment variables, restart control, and application logs;
- disposable MySQL/MariaDB database and least-privilege user;
- staging HTTPS domain;
- private SMTP mailbox plus access to its receiving inbox;
- a private directory outside the Git checkout for runtime configuration, storage, and backups.

Suggested evidence header:

```text
Staging domain: [redacted host]
Git commit: b834e7e or later reviewed commit
Validation date/time (UTC):
Operator:
cPanel product/version:
Node version:
MySQL or MariaDB version:
Database character set:
Database collation:
Application root (redacted prefix):
Runtime config path (redacted prefix):
Storage root (redacted prefix):
Result: PASS / FAIL / BLOCKED
```

## 1. Prepare isolated resources

- [ ] Create a staging subdomain with valid HTTPS.
- [ ] Create a new empty MySQL/MariaDB database and dedicated user with only the privileges needed to migrate and use that database.
- [ ] Create private directories such as:

```text
/home/ACCOUNT/apps/lisan-staging/       # Git application root
/home/ACCOUNT/private/lisan-staging/    # runtime-config.json and backups
/home/ACCOUNT/data/lisan-staging/       # durable storage
```

- [ ] Confirm the private paths are outside `public_html`, not web-addressable, and writable only by the cPanel account/application user.
- [ ] Create a staging SMTP sender and receiving inbox. Do not reuse production credentials.
- [ ] Back up any pre-existing staging database, runtime file, and storage before replacement.

## 2. Record the actual platform

Use cPanel Terminal when available, or the Node.js App UI equivalents:

```bash
node --version
npm --version
pwd
```

Record the values. Node must satisfy `^20.19.0 || ^22.12.0 || >=24.0.0 <25`; Node 22 LTS is recommended.

After database credentials are available, record database behavior without printing the password:

```sql
SELECT VERSION() AS database_version;
SELECT @@character_set_database AS database_charset,
       @@collation_database AS database_collation,
       @@character_set_connection AS connection_charset,
       @@collation_connection AS connection_collation;
```

Expected: `utf8mb4` database/connection character sets and a Unicode-aware `utf8mb4` collation. Do not weaken constraints to accommodate an incompatible server.

## 3. Deploy the fresh application

- [ ] Clone the repository into the private application root and check out the reviewed commit.
- [ ] Configure cPanel Node.js App in Production mode with `server.cjs` as startup file and the staging HTTPS URL.
- [ ] Set these non-secret/environment values as applicable:

```text
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://STAGING_HOST
HOSTNAME=0.0.0.0
LISAN_APPLICATION_ROOT=/home/ACCOUNT/apps/lisan-staging
LISAN_RUNTIME_CONFIG_PATH=/home/ACCOUNT/private/lisan-staging/runtime-config.json
STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=/home/ACCOUNT/data/lisan-staging
STORAGE_PUBLIC_BASE_URL=https://STAGING_HOST/media
SMTP_HOST=...
SMTP_PORT=587
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_FROM_NAME=Lisan Staging
SMTP_FROM_EMAIL=...
```

Do not define `DATABASE_URL`, `AUTH_SECRET`, or `APP_ENCRYPTION_KEY` before the installer unless deliberately testing environment overrides.

- [ ] Run:

```bash
npm ci
npm run build
```

- [ ] Confirm `.next/standalone/server.js`, `.next/standalone/.next/static`, `prisma/migrations`, and `node_modules/prisma/build/index.js` exist.
- [ ] Start/restart the cPanel application and record Passenger’s effective working directory from a safe diagnostic if needed. Never log environment values.
- [ ] Open the staging root and confirm an HTTPS redirect to `/install` with all readiness checks passing.

## 4. Complete and verify the installer

- [ ] Enter the disposable database host, port, name, username, and password in `/install`; do not capture a screenshot containing credentials.
- [ ] Use a unique staging super-admin email and strong password.
- [ ] Skip AI/voice or use disposable credentials only.
- [ ] Complete installation once.
- [ ] Confirm the UI reports completion and no credential appears in the response or cPanel logs.
- [ ] After installation, add the installed `DATABASE_URL` to the private cPanel Node.js environment so future CLI migrations do not require placing it in shell history. Restart the application after changing environment variables.
- [ ] Confirm both migrations were applied:

```bash
npx prisma migrate status
```

Expected migrations:

```text
20260828000100_installer_foundation
20260828000200_phase1_core_domain
20260828000300_phase2_learner_experience
```

- [ ] In MySQL, verify `_prisma_migrations` shows both successful and no failed/rolled-back entry.
- [ ] Verify `app_settings.installation.completed` is true and exactly one intended super-admin exists. Never select password hashes into shared evidence.
- [ ] Refresh `/install` and call it in a new private browser session; both must redirect to authentication and expose no installer form.

## 5. Verify Unicode and schema integrity

Run redacted read-only checks:

```sql
SHOW TABLE STATUS WHERE Name IN ('users','languages','courses','lesson_blocks');
SHOW FULL COLUMNS FROM languages;
SELECT code, name, native_name, direction FROM languages ORDER BY code;
SELECT slug, source_language_id, target_language_id, status FROM courses WHERE slug='arabic-foundation-bn';
```

- [ ] Confirm Bengali `বাংলা` and Arabic `العربية` round-trip exactly.
- [ ] Confirm tables use `utf8mb4` and the expected collation.
- [ ] Confirm unique constraints reject a duplicate user email and duplicate course slug inside a transaction that is rolled back.
- [ ] Confirm an installation transaction rollback test uses only a disposable database and leaves no partial seed data.
- [ ] Confirm the initial course is `draft`, source `bn`, target `ar`.

## 6. Verify super-admin authentication

- [ ] Open `/login?next=/admin`; authenticate with the installer-created account.
- [ ] Confirm redirect to `/admin`.
- [ ] Confirm `/settings` is accessible.
- [ ] Confirm the session cookie is HTTP-only, `Secure`, `SameSite=Lax`, scoped to `/`, and uses the production `__Secure-` name.
- [ ] Log out and confirm `/admin` redirects to `/login?next=/admin`.
- [ ] Confirm repeated invalid logins are eventually rejected by database-backed rate limiting without revealing whether the email exists.

## 7. Verify learner registration and authorization

- [ ] Create a fresh learner through `/signup` using a disposable inbox.
- [ ] Confirm redirect to `/learn/onboarding` or the learner landing page.
- [ ] Confirm `/learn`, `/profile`, and `/settings` are accessible.
- [ ] Confirm direct `/admin` access redirects the learner to `/learn`.
- [ ] Inspect the learner row with a redacted query and confirm:

```text
role=student
status=active
native language=bn
learning language=ar
country=BD
timezone=Asia/Dhaka
daily goal=10
student mode=standard
onboarding state=not_started
```

- [ ] Attempt to add `role`, `status`, or language IDs to browser requests; confirm the server ignores them.
- [ ] Attempt duplicate-email signup and confirm a safe application message with no SQL details.
- [ ] Complete all four onboarding steps and confirm the stored level, goal, daily minutes, mode, locale, completion time, and deterministic recommendation.
- [ ] Repeat onboarding submission in a disposable test and confirm there is still exactly one enrollment for the initial course.
- [ ] Confirm dashboard values are database-derived and that repeated refreshes do not create activity, XP, lesson progress, or streak records.
- [ ] Confirm profile/settings edits affect only the signed-in student; browser-supplied role, status, user ID, XP, and progress fields have no effect.
- [ ] Open the enrolled course overview and confirm unpublished levels, units, and lessons are not exposed; a non-enrolled course slug returns a safe not-found response.
- [ ] Verify the Bangla/English interface switch persists and child mode changes presentation without changing authorization or TTS voice configuration.

## 8. Verify SMTP password recovery

- [ ] Submit forgot-password for both an existing and nonexistent email and confirm the public response is indistinguishable.
- [ ] Confirm exactly one reset message arrives for the real learner and contains the staging HTTPS origin.
- [ ] Confirm logs do not contain the token, reset URL, password, or account-existence decision.
- [ ] Open the link and set a new strong password.
- [ ] Confirm the old password fails and the new password succeeds.
- [ ] Confirm a second use of the same link fails.
- [ ] Confirm the learner’s pre-reset browser session no longer authenticates.
- [ ] In a disposable test only, create/wait for an expired token and confirm it fails after 30 minutes. Do not alter production server time.
- [ ] Trigger reset throttling and confirm generic responses remain enumeration-safe.

## 9. Verify private storage

- [ ] Confirm the absolute `STORAGE_LOCAL_ROOT` is writable by Passenger.
- [ ] Exercise the storage provider with a non-sensitive test asset through a staging-only test command or automated test, not an arbitrary public upload form.
- [ ] Confirm the generated filename is opaque and remains under the configured root.
- [ ] Confirm traversal/absolute-key attempts fail.
- [ ] Confirm private data cannot be retrieved from `/storage`, `/media/private`, its filesystem key, or a guessed URL.
- [ ] Restart Passenger and confirm the test object remains readable through the authorized storage service, then delete the test object.

## 10. Verify public security behavior

Request only the staging host and retain redacted status/header evidence:

```bash
curl -I https://STAGING_HOST/
curl -I https://STAGING_HOST/.env
curl -I https://STAGING_HOST/.runtime-config.json
curl -I https://STAGING_HOST/storage/
curl -I https://STAGING_HOST/admin
```

- [ ] Secret/runtime/storage requests return 404 or another safe denial and never file contents.
- [ ] Responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, the configured referrer policy, and permissions policy.
- [ ] HTTPS is enforced by the domain/proxy.
- [ ] No response or log contains database URLs/passwords, SMTP credentials, AI keys/envelopes, `AUTH_SECRET`, or `APP_ENCRYPTION_KEY`.
- [ ] Installer actions remain closed after completion.

## 11. Restart persistence

- [ ] Restart from the Node.js App UI.
- [ ] Restart using the host-supported Passenger mechanism.
- [ ] Refresh existing and new browser sessions.
- [ ] Confirm the application remains installed, super-admin and learner data remain, authentication works, and storage survives.
- [ ] Confirm `server.cjs` still resolves application root, runtime configuration, Prisma CLI, and standalone assets when Passenger changes the working directory.

## 12. Update rehearsal

Before updating, record commit and create timestamped backups:

```text
MySQL dump
private runtime-config.json
entire durable storage root
current Git commit and build artifact/release directory
```

Then run the controlled update:

```bash
git pull --ff-only
npm ci
npx prisma migrate deploy
npm run build
# restart through cPanel/Passenger
```

- [ ] `prisma migrate deploy` reports no duplicate/destructive reapplication.
- [ ] `/install` remains locked.
- [ ] Existing super-admin, learner, settings, and course remain unchanged.
- [ ] Login, authorization, SMTP reset, storage, and security-header smoke tests still pass.

## 13. Rollback rehearsal

Do not automatically reverse Prisma migrations. For a failed code-only release:

1. Stop or maintenance-gate staging traffic.
2. Restore the prior reviewed Git commit/release directory.
3. Run `npm ci` and `npm run build` with the matching Node version.
4. Restore the matching private runtime configuration and storage only when they changed.
5. Restore the verified pre-deployment database backup when the newer migration is incompatible with the prior code.
6. Restart Passenger and repeat installer-lock, login, authorization, Unicode, and storage checks.

- [ ] Record recovery time and evidence.
- [ ] Never use `git reset --hard`, delete installation markers, or manually drop migration records as a rollback shortcut.

## Failure report template

```text
Check number:
PASS / FAIL / BLOCKED:
Expected:
Observed (redacted):
MySQL/MariaDB version:
Node version:
Relevant safe log excerpt:
Reproduction steps:
Repository commit:
No secrets included: yes/no
```

Stop validation on any secret exposure, migration corruption, unexpected installer reopening, or cross-role access. Preserve backups and redacted evidence before attempting a scoped fix.
