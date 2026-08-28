# Database Architecture

## Phase 0 status

No schema or migration is created in Phase 0. `prisma/` is reserved for a reviewed schema in the database phase. Production targets MySQL/MariaDB through Prisma; Supabase/PostgreSQL is not part of the architecture.

## Planned domains

- Identity: users, Auth.js accounts/sessions/verification tokens, profiles, roles.
- Catalog: languages, courses, levels, units, lessons, lesson blocks.
- Learning content: vocabulary, phrases, translations, exercises, Arabic-letter and articulation metadata.
- Progress: enrollments, lesson progress, exercise attempts, streak/XP ledger, pronunciation results.
- Review: vocabulary review state and review events.
- Media: audio assets, content hashes, provider and storage metadata.
- Governance: achievements, audit events, content review/publishing metadata.

## Core relationships

Each course has `source_language_id` and `target_language_id`. The hierarchy is Course → Level → Unit → Lesson → ordered Lesson Blocks → Exercises. Translation tables refer to language records instead of columns named for only Bangla or Arabic. Arabic-specific metadata may extend generic content records without making the engine Arabic-only.

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
