# Database Architecture

## Migration status

The immutable first migration creates the installer foundation. The Phase 1 migration expands existing users in place and adds identity recovery, course catalog/enrollment, AI feature routing/fallback, voice assignment, teaching style, media metadata, and database rate-limit tables. It safely seeds `bn`, `ar`, `en`, plus draft course `arabic-foundation-bn`. Fresh installer runs and existing installations use the same ordered migration history.

## Implemented Phase 1 domains

- Identity: users, future Auth.js accounts, password-reset/verification/invitation tokens, profiles, roles, status, session version.
- Catalog: languages, courses, levels, units, lessons, versioned lesson blocks.
- Learning content: vocabulary, phrases, translations, exercises, Arabic-letter and articulation metadata.
- Progress: course enrollment/current lesson/start/completion only; advanced progress remains deferred.
- Review: vocabulary review state and review events.
- Media: audio assets, content hashes, provider and storage metadata.
- AI operations: provider connections, encrypted credentials, models/capabilities, feature routes, fallbacks, usage events, and connection checks.
- Voice: voice profiles, assignment rules, and separately managed teaching styles.
- Governance: achievements, audit events, content review/publishing metadata.

## Core relationships

Each course has `source_language_id` and `target_language_id`. The hierarchy is Course → Level → Unit → Lesson → ordered Lesson Blocks → Exercises. Translation tables refer to language records instead of columns named for only Bangla or Arabic. Arabic-specific metadata may extend generic content records without making the engine Arabic-only.

## AI provider records

Phase 1 persists providers, encrypted credentials, models, feature routes and ordered fallbacks. Capability detail remains in validated model JSON until later admin/adapter work requires normalized capability rows. Connection checks and usage events remain planned for the AI administration phase because Phase 1 performs no runtime AI calls.

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

## Voice and teaching records

- `voice_profiles`: name, provider ID, provider voice ID, language ID, speaking rate, style/instructions, purpose, enabled state, validated provider metadata, timestamps.
- `voice_profile_assignments`: voice profile ID plus optional student mode, course ID, activity type, TTS purpose, priority, and enabled state.
- `teaching_styles`: pedagogical/personality instructions, explanation level, encouragement style, optional student mode/scope, and enabled state.

Assignment resolution must be deterministic and documented. More specific matching rules win, then explicit priority, then stable ID as a final tie-breaker. Referential checks must prevent assigning a disabled/incompatible voice profile. Teaching styles never contain provider voice settings.

## Identity constraints

Emails are unique and normalized by application services. Roles are validated against `student`, `parent`, `teacher`, `content_editor`, `admin`, and `super_admin`; complete authorization is provided now for student/admin/super-admin. Account `status` and `session_version` are rechecked from MySQL for every Auth.js session. Optional native/learning language foreign keys keep learner defaults generic. Date of birth is nullable; `student_mode` is independent of age.

Reset/verification/invitation secrets are stored only as hashes and include expiry/consumption timestamps. Auth.js uses JWT sessions, so there is intentionally no database session-token table in Phase 1.

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
