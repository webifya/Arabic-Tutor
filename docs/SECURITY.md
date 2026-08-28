# Security Baseline

## Secrets and environment

- Commit only `.env.example`; never commit keys, credentials, production origins, session secrets, or real user data.
- Only `NEXT_PUBLIC_*` values may be exposed to browser bundles. `OPENAI_API_KEY`, `DATABASE_URL`, and `AUTH_SECRET` are server-only.
- Use a separate least-privilege database user and OpenAI project key per environment. Rotate exposed credentials immediately.
- Validate environment and request data at server boundaries; fail closed in production.

Official OpenAI guidance requires API keys to remain secret and be loaded from a server environment variable or key-management service. OpenAI integration must live under `src/lib/ai` and never be imported by client components.

## Authentication and authorization

Auth.js integration will be implemented in Phase 1. Require verified identity for private routes, authorize resources and roles on every server action/handler, use secure HTTP-only cookies, protect state-changing requests, and invalidate/reset sessions safely. Never rely on hidden UI or client claims for authorization.

## Data and children

Collect only necessary profile data; date of birth is optional unless a reviewed requirement needs it. Treat child-mode data and recordings as sensitive. Define retention/deletion workflows before collecting production learner data. Keep audit logs free of secrets, raw audio, and unnecessary personal content.

## Audio, AI, and uploads

- Raw microphone recordings are temporary by default: validate type/size/duration, isolate them, process, save only derived results, and delete in success and error paths.
- Never expose one learner's media to another. Use opaque names and authorization checks; local paths are not access control.
- Separate speech recognition output, deterministic comparison, and AI coaching. Do not label estimates as acoustic or phoneme measurements.
- Constrain tutor context, validate structured output, rate-limit/cap cost, handle provider timeouts, and never allow AI to directly change progress.
- Review OpenAI data controls and retention choices before production audio/tutor launch.

## Application and operations

- Validate and authorize server-side scoring/progress updates; use transactions and idempotency for repeat requests.
- Apply rate limits to auth, uploads, AI, speech, password reset, and expensive queries using shared durable state.
- Set upload/body limits, timeouts, secure headers, HTTPS, dependency updates, database backups, and least-privilege filesystem permissions.
- Avoid logging passwords, tokens, full prompts containing personal data, database URLs, raw audio, or provider responses with sensitive content.
- Report vulnerabilities privately to the repository owner; do not open public issues containing exploit or user data.

## Phase 0 posture

Phase 0 has no authentication, database connection, user input endpoints, upload flow, or OpenAI call. The committed configuration demonstrates separation but deliberately accepts absent production secrets so CI can build. Each later provider must validate its required variables at initialization and production startup/health checks must verify complete configuration.
