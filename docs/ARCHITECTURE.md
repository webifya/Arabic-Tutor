# Architecture

## Scope and principles

Phase 0 establishes boundaries, not product features. Lisan begins with Bangla → Arabic Foundation, but language pairs, lesson blocks, exercises, translations, progress, AI, and speech must remain reusable.

The production runtime is a long-lived standard Node.js process under cPanel Passenger. Next.js uses App Router and standalone output; core behavior must not depend on Edge or Vercel services.

## Layers

1. `src/app`: routes, layouts, Server Components, and route handlers.
2. `src/components`: reusable UI and Arabic-specific rendering primitives.
3. `src/server/services`: authorization-aware application workflows and progress rules.
4. `src/lib/db`: Prisma client and repositories.
5. `src/lib/auth`: Auth.js configuration, session access, and role checks.
6. `src/lib/storage`: storage provider contract and local/cPanel implementation.
7. `src/lib/ai`: provider-neutral AI/speech contracts, routing, credential access, tutor orchestration, and vendor adapters.
8. `src/config` and `src/i18n`: validated settings, branding, and typed UI messages.

Later phases should enforce dependencies inward: routes call services; services call repositories/providers. UI must not call Prisma, AI vendor, speech vendor, or storage SDKs directly.

## Runtime and data flow

- Server Components read through services/repositories.
- Route Handlers and Server Actions validate input, authenticate, authorize, invoke services, and return minimal data.
- Important exercise scoring and progress updates occur server-side in transactions.
- Uploaded audio is streamed to temporary private storage, processed, and deleted unless explicit retention is enabled.
- Generated reference audio is stored via the storage abstraction and deduplicated by a content hash.

## Multilingual model

UI localization (`bn`, `en`) is separate from course content. Courses refer to source and target language records. Localizable content uses translation records or structured locale fields where justified. Arabic typography components apply local `lang="ar"` and `dir="rtl"`; the Bangla page remains LTR.

## Provider boundaries

- Database: MySQL/MariaDB via Prisma.
- Authentication: Auth.js with database-backed users/accounts/sessions as selected in Phase 1.
- Storage: `StorageProvider` contract; local filesystem is the initial cPanel implementation, and object storage can be added later.
- AI/speech: capability interfaces under `src/lib/ai` for text/chat, content generation, speech-to-text, text-to-speech, and pronunciation analysis. OpenAI, Gemini, Claude, OpenAI-compatible endpoints, and future vendors are adapters rather than application dependencies.

## AI provider routing

Application features request a capability by stable feature key (for example `tutor.answer`, `lesson.reference_audio`, or `pronunciation.evaluate`). A server-side router resolves the enabled primary provider/model and an ordered fallback chain. Business services consume normalized contracts and do not inspect vendor names.

Provider adapters own vendor request/response translation. The router owns capability checks, health/circuit decisions, timeouts, and fallback eligibility. It must not retry unsafe/non-idempotent requests blindly. Usage events record provider, model, feature, latency, status, and provider-reported units without logging credentials or sensitive payloads. See `docs/AI-SYSTEM.md`.

Provider connections and credentials are separate records. An admin may create, test, enable, disable, and select models later, but secret values are accepted and encrypted only on the server. Browser responses contain connection metadata and a `credential_present` indicator, never ciphertext or plaintext.

## Voice profiles and teaching styles

Voice profiles are reusable TTS presentation settings that reference a provider connection and provider voice ID. Resolution can consider language, purpose, student mode, course, and activity type, with deterministic specificity and priority rules. Provider-specific options remain validated metadata at the adapter boundary.

Teaching/personality style is resolved independently. A child-mode learner may receive simpler, encouraging Bangla tutoring while an accurate adult Arabic reference voice is selected for pronunciation. A child-friendly voice means an age-appropriate synthetic presentation supported by the provider; Lisan does not require cloning or impersonating a real child.

## Operational constraints

The Node process must be horizontally safe: do not rely on in-memory sessions, job state, rate limits, or durable caches. Use database-backed coordination when those features arrive. Long AI/audio requests need explicit size and time limits suitable for shared hosting.
