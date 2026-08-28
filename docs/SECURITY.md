# Security Baseline

## Secrets and environment

- Commit only `.env.example`; never commit keys, credentials, production origins, session secrets, or real user data.
- Only `NEXT_PUBLIC_*` values may be exposed to browser bundles. `OPENAI_API_KEY`, `DATABASE_URL`, and `AUTH_SECRET` are server-only.
- Use a separate least-privilege database user and scoped provider credential per environment. Rotate exposed credentials immediately.
- Validate environment and request data at server boundaries; fail closed in production.

Official OpenAI guidance demonstrates API keys loaded from server environment variables. Apply that server-only boundary to every AI/speech provider. Integrations must live under `src/lib/ai` and never be imported by client components.

Database-managed provider credentials must be encrypted with authenticated encryption using `APP_ENCRYPTION_KEY`, which stays outside MySQL and is distinct from `AUTH_SECRET`. Never implement secret reveal, return ciphertext/plaintext to the browser, or log secrets. Support key versioning, rotation, redacted audits, and deletion. Treat encrypted backups as sensitive.

## Authentication and authorization

Auth.js credentials authentication uses encrypted eight-hour JWT sessions in HTTP-only, `SameSite=Lax`, production-secure cookies. Each server session refreshes role, account status, and `session_version` from MySQL. Password changes increment the version and invalidate earlier sessions. `/admin/**`, `/learn/**`, `/profile/**`, and `/settings/**` enforce authorization in server components; browser role claims and hidden UI are never authorization.

Login, signup, and reset attempts use database-backed rate-limit buckets. Reset tokens contain 256 random bits, are stored only as SHA-256 hashes, expire after 30 minutes, and are consumed transactionally once. Forgot-password responses do not disclose account existence. SMTP credentials remain server-only and delivery failure is not represented as successful confirmed delivery.

## Data and children

Collect only necessary profile data; date of birth is optional unless a reviewed requirement needs it. Treat child-mode data and recordings as sensitive. Define retention/deletion workflows before collecting production learner data. Keep audit logs free of secrets, raw audio, and unnecessary personal content.

## Audio, AI, and uploads

- Raw microphone recordings are temporary by default: validate type/size/duration, isolate them, process, save only derived results, and delete in success and error paths.
- Never expose one learner's media to another. Use opaque names and authorization checks; local paths are not access control.
- Separate speech recognition output, deterministic comparison, and AI coaching. Do not label estimates as acoustic or phoneme measurements.
- Constrain tutor context, validate structured output, rate-limit/cap cost, handle provider timeouts, and never allow AI to directly change progress.
- Review OpenAI data controls and retention choices before production audio/tutor launch.
- Validate custom provider URLs against SSRF: use HTTPS by default; reject loopback, link-local, metadata, and private targets unless explicitly allowlisted; revalidate redirects and resolved addresses.

## Application and operations

- Validate and authorize server-side scoring/progress updates; use transactions and idempotency for repeat requests.
- Apply rate limits to auth, uploads, AI, speech, password reset, and expensive queries using shared durable state.
- Set upload/body limits, timeouts, secure headers, HTTPS, dependency updates, database backups, and least-privilege filesystem permissions.
- Avoid logging passwords, tokens, full prompts containing personal data, database URLs, raw audio, or provider responses with sensitive content.
- Report vulnerabilities privately to the repository owner; do not open public issues containing exploit or user data.

## Phase 0 posture

The first-run installer is a narrow unauthenticated bootstrap surface that closes permanently after installation. It uses same-origin Server Actions, Zod validation, bounded tests, file-backed rate limits, an exclusive lock, parameterized SQL, fixed migration execution, strong password hashing, and encrypted provider credentials. See `docs/INSTALLER.md`.

Normal database-backed routes remain unavailable until explicit completion. After completion, `/install` redirects and every installer mutation rechecks state. There is no browser-accessible reset, secret reveal, arbitrary SQL, command execution, filesystem path, Git pull, or update endpoint.

## Phase 1 storage posture

The local driver accepts only declared media purposes and allowlisted MIME types, generates opaque keys, rejects absolute/traversal paths, writes atomically with private permissions, and distinguishes public/private namespaces. Production storage should use an absolute path outside the release directory. Raw microphone audio remains temporary and is not retained by any Phase 1 route.
