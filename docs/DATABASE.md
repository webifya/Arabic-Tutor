# Database Architecture

## Installer foundation status

The first reviewed Prisma migration creates only the installation foundation: application settings, languages, super-admin-compatible users, initial AI provider/credential/model records, and voice profiles. Course, progress, lesson, exercise, and later Auth.js account/session schemas remain deferred. Production targets MySQL/MariaDB through Prisma; Supabase/PostgreSQL is not part of the architecture.

## Planned domains

- Identity: users, Auth.js accounts/sessions/verification tokens, profiles, roles.
- Catalog: languages, courses, levels, units, lessons, lesson blocks.
- Learning content: vocabulary, phrases, translations, exercises, Arabic-letter and articulation metadata.
- Progress: enrollments, lesson progress, exercise attempts, streak/XP ledger, pronunciation results.
- Review: vocabulary review state and review events.
- Media: audio assets, content hashes, provider and storage metadata.
- AI operations: provider connections, encrypted credentials, models/capabilities, feature routes, fallbacks, usage events, and connection checks.
- Voice: voice profiles, assignment rules, and separately managed teaching styles.
- Governance: achievements, audit events, content review/publishing metadata.

## Core relationships

Each course has `source_language_id` and `target_language_id`. The hierarchy is Course → Level → Unit → Lesson → ordered Lesson Blocks → Exercises. Translation tables refer to language records instead of columns named for only Bangla or Arabic. Arabic-specific metadata may extend generic content records without making the engine Arabic-only.

## Planned AI provider records

Phase 1 should prepare the following relational design before creating migrations:

- `ai_providers`: adapter key/type (`openai`, `gemini`, `anthropic`, `openai_compatible`, or future), display name, optional validated base URL, enabled state, timestamps.
- `ai_provider_credentials`: provider ID, encrypted envelope, encryption key version, safe label, credential type, created/rotated timestamps, and creator. Never store plaintext, a reversible key beside ciphertext, or a browser-readable secret fragment.
- `ai_provider_models`: provider ID, vendor model ID, display name, enabled state, capability metadata, last-discovered timestamp.
- `ai_provider_model_capabilities`: normalized model-to-capability rows for text/chat, content generation, STT, TTS, and pronunciation analysis.
- `ai_feature_routes`: stable application feature key, required capability, primary provider/model, enabled state, timeout/policy metadata.
- `ai_feature_route_fallbacks`: route, provider/model, order, and enabled state. Enforce unique ordering and prevent the primary route from repeating in fallback rows.
- `ai_provider_connection_checks`: provider, redacted outcome/error code, latency, actor, and timestamp; no secret or raw provider response.
- `ai_usage_events`: provider/model/feature, request correlation ID, status, latency, provider-reported input/output/audio units, optional estimated cost/currency, and timestamp. Usage is operational unless reconciled with authoritative vendor billing.

A provider connection may expose multiple capabilities and models. Routes reference enabled models with the required capability; application code never stores a vendor name as the routing decision.

Credentials use authenticated encryption such as AES-256-GCM with a versioned envelope containing algorithm/version, key version, nonce, ciphertext, and authentication tag. `APP_ENCRYPTION_KEY` is a separate server secret and MUST NOT be stored in MySQL. Support key rotation by decrypting with the recorded key version and rewriting with the current key. Backups containing ciphertext remain sensitive.

Custom/OpenAI-compatible base URLs require server-side URL validation and an explicit trust policy to prevent SSRF. Default to HTTPS and reject loopback, link-local, cloud metadata, and private-network targets unless an operator deliberately allowlists a trusted internal endpoint.

## Planned voice and teaching records

- `voice_profiles`: name, provider ID, provider voice ID, language ID, speaking rate, style/instructions, purpose, enabled state, validated provider metadata, timestamps.
- `voice_profile_assignments`: voice profile ID plus optional student mode, course ID, activity type, TTS purpose, priority, and enabled state.
- `teaching_styles`: pedagogical/personality instructions, explanation level, encouragement style, optional student mode/scope, and enabled state.

Assignment resolution must be deterministic and documented. More specific matching rules win, then explicit priority, then stable ID as a final tie-breaker. Referential checks must prevent assigning a disabled/incompatible voice profile. Teaching styles never contain provider voice settings.

## Conventions

- Use stable opaque IDs (UUID/CUID strategy to be decided before the first migration).
- Store timestamps in UTC and render in the user's timezone.
- Use explicit unique constraints for slugs, language codes, ordering, deduplication hashes, and idempotency keys.
- Store flexible block payloads as validated JSON only when relational columns would be less safe or useful; include a schema version.
- Treat scores and money-like counters as precise numeric values, not floating guesses.
- Index foreign keys and common progress/review queries.
- Use soft deletion only for domains with a real recovery/audit need.

## Migration policy

1. Change `prisma/schema.prisma` and generate a named development migration.
2. Review generated SQL specifically for the production MariaDB/MySQL version.
3. Back up production before deployment.
4. Prefer expand/migrate/contract changes; do not combine destructive schema changes with code that still expects old columns.
5. Deploy migrations once, then restart Passenger. Never run `db push` in production.
6. Document data backfills and rollback steps. Restoring a verified backup is the fallback for irreversible migrations.

The exact cPanel database version, collation, connection limit, and timezone settings must be recorded before Phase 1. Use `utf8mb4` and a Unicode-aware collation that preserves Arabic diacritics and Bangla text correctly; verify comparison semantics with tests.
