# Architecture

## Scope and principles

Phase 3 adds a database-driven course and lesson loop to the authenticated learner journey established in Phases 0–2. Lisan begins with Bangla → Arabic Foundation, but language pairs, learner preferences, progress records, lesson blocks, authentication, storage, AI, and speech remain reusable.

The production runtime is a long-lived standard Node.js process under cPanel Passenger. Next.js uses App Router and standalone output; core behavior must not depend on Edge or Vercel services.

## Bootstrap and installation mode

Lisan can start without a database solely for first-run installation. Server-rendered entry routes read explicit installation state from a private runtime configuration and redirect uninstalled requests to `/install`. Installer actions are the only mutation surface available in this state. Database-backed routes must call the same installation guard before accessing repositories.

The runtime configuration is never public or bundled as an asset. It solves the pre-database bootstrap problem and merges with environment variables using environment-first precedence. Completion is recorded in both runtime state and `app_settings`; table existence is never treated as completion. See `docs/INSTALLER.md`.

## Layers

1. `src/app`: routes, layouts, Server Components, and route handlers.
2. `src/components`: reusable UI and Arabic-specific rendering primitives.
3. `src/server/services`: authorization-aware application workflows and progress rules.
4. `src/lib/db`: Prisma client and repositories.
5. `src/lib/auth`: Auth.js configuration, session access, and role checks.
6. `src/lib/storage`: storage provider contract and local/cPanel implementation.
7. `src/lib/ai`: provider-neutral AI/speech contracts, routing, credential access, tutor orchestration, and vendor adapters.
8. `src/config` and `src/i18n`: validated settings, branding, and typed UI messages.
9. `src/lib/installer`: bootstrap state, private drafts, readiness, locks/rate limits, encryption/password primitives, migration orchestration, and initial seed transaction.

Later phases should enforce dependencies inward: routes call services; services call repositories/providers. UI must not call Prisma, AI vendor, speech vendor, or storage SDKs directly.

## Runtime and data flow

- Server Components read through services/repositories.
- Route Handlers and Server Actions validate input, authenticate, authorize, invoke services, and return minimal data.
- Important exercise scoring and progress updates occur server-side in transactions.
- Uploaded audio is streamed to temporary private storage, processed, and deleted unless explicit retention is enabled.
- Generated reference audio is stored via the storage abstraction and deduplicated by a content hash.

## Multilingual model

UI localization (`bn`, `en`) is separate from course content. Courses refer to source and target language records. Localizable content uses translation records or structured locale fields where justified. Arabic typography components apply local `lang="ar"` and `dir="rtl"`; the Bangla page remains LTR.

The learner shell, onboarding, dashboard, course overview, profile, and settings select typed Bangla/English messages from the authenticated user's `interface_locale`. Student mode is presentation/pedagogy metadata, not an authorization role. Child mode may increase visual clarity now; teaching-style and voice resolution remain separate later capabilities.

## Learner journey and progress boundaries

Authenticated students who have not completed onboarding are redirected to `/learn/onboarding`. Completion validates a fixed questionnaire, stores a deterministic recommended starting-point key, and idempotently ensures enrollment in the initial course. A recommendation does not create progress or pretend that a lesson was completed.

The dashboard reads enrollment, published lesson counts, lesson progress, daily activity, XP ledger, and learner-local dates from MySQL. Merely rendering or refreshing a page never creates activity, XP, a streak, or progress. Future lesson completion services must write those records transactionally and use stable source IDs so duplicate requests cannot award XP twice. The course overview requires an active enrollment and exposes only published levels, units, and lessons; draft content remains hidden even when the course container itself is still being prepared.

## Lesson engine

The stable hierarchy is Course → Level → Unit → Lesson → ordered Lesson Blocks. A lesson route never selects a React page by lesson slug. It loads an enrolled, fully published hierarchy; checks that the lesson is completed or the first incomplete lesson; validates each versioned JSON payload with its block-specific Zod schema; enriches referenced letter, phrase, and vocabulary records; and passes only normalized data to reusable components.

Phase 3 supports heading, explanation, Arabic text/letter, vocabulary, phrase, example, tip, audio/pronunciation placeholders, multiple choice, and continue blocks. Unknown or invalid blocks fail closed and are not rendered. Audio controls explicitly remain disabled. Future block types can be added through a schema, normalized public contract, renderer, and completion policy without changing the lesson route.

Multiple-choice answer keys remain in server-loaded block content and are removed from the public payload. An answer action re-authorizes the learner, re-loads the published authoritative block, validates the selected option, and stores the attempt. Lesson completion runs inside one transaction: verify enrollment/unlock state and required questions, upsert completion once, insert XP idempotently, record daily activity only on first completion, and advance enrollment to the first incomplete published lesson.

## Provider boundaries

- Database: MySQL/MariaDB via Prisma.
- Authentication: Auth.js with database-backed users/accounts/sessions as selected in Phase 1.
- Storage: `StorageProvider` contract; local filesystem is the initial cPanel implementation, and object storage can be added later.
- AI/speech: capability interfaces under `src/lib/ai` for text/chat, content generation, speech-to-text, text-to-speech, and pronunciation analysis. OpenAI, Gemini, Claude, OpenAI-compatible endpoints, and future vendors are adapters rather than application dependencies.

## AI provider routing

Application features request a capability by stable feature key (for example `tutor.answer`, `lesson.reference_audio`, or `pronunciation.evaluate`). A server-side router resolves the enabled primary provider/model and an ordered fallback chain. Business services consume normalized contracts and do not inspect vendor names.

Provider adapters own vendor request/response translation. The router owns capability checks, health/circuit decisions, timeouts, and fallback eligibility. It must not retry unsafe/non-idempotent requests blindly. Usage events record provider, model, feature, latency, status, and provider-reported units without logging credentials or sensitive payloads. See `docs/AI-SYSTEM.md`.

## Identity, settings, and storage

Auth.js issues eight-hour encrypted JWT sessions in HTTP-only, same-site cookies. Every session read refreshes user role, status, and session version from MySQL, so disabling an account, changing its role, or resetting its password takes effect server-side. Route components call reusable authorization helpers; browser role claims are ignored. Password reset tokens are random, SHA-256 hashed at rest, single-use, and expire after 30 minutes. See `docs/AUTHENTICATION.md`.

Normal application settings are cached for 30 seconds through a typed server service; secrets remain in environment/private runtime configuration. Durable assets use `StorageProvider`; the local driver creates opaque filenames, validates purpose/MIME pairs, separates public/private keys, and confines all paths to the configured root.

Provider connections and credentials are separate records. An admin may create, test, enable, disable, and select models later, but secret values are accepted and encrypted only on the server. Browser responses contain connection metadata and a `credential_present` indicator, never ciphertext or plaintext.

## Voice profiles and teaching styles

Voice profiles are reusable TTS presentation settings that reference a provider connection and provider voice ID. Resolution can consider language, purpose, student mode, course, and activity type, with deterministic specificity and priority rules. Provider-specific options remain validated metadata at the adapter boundary.

Teaching/personality style is resolved independently. A child-mode learner may receive simpler, encouraging Bangla tutoring while an accurate adult Arabic reference voice is selected for pronunciation. A child-friendly voice means an age-appropriate synthetic presentation supported by the provider; Lisan does not require cloning or impersonating a real child.

## Operational constraints

The Node process must be horizontally safe: do not rely on in-memory sessions, job state, rate limits, or durable caches. Use database-backed coordination when those features arrive. Long AI/audio requests need explicit size and time limits suitable for shared hosting.

The first-run installer is the documented exception: before a database exists it uses private atomic files for drafts, rate limits, and its exclusive lock. This targets one cPanel application root. Replace that bootstrap coordination before running multiple application roots concurrently.
