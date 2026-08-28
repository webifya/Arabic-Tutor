# AI, Speech, and Voice System

Phase 1 now persists provider/model feature routes, ordered fallbacks, optional TTS voice-profile references, voice assignment rules, and separate teaching styles. Runtime routing/adapters, usage accounting, connection checks, and the administration UI remain deliberately deferred.

## Status and goals

This is a planning contract for later phases. Phase 0 contains TypeScript interfaces but makes no provider calls, stores no credentials, and exposes no AI administration UI.

Lisan is provider-independent. OpenAI, Google Gemini, Anthropic Claude, optional OpenAI-compatible endpoints, dedicated speech/pronunciation services, and future providers are adapters behind capability interfaces. No course, exercise, tutor, progress, or UI module may select a vendor directly.

## Capabilities

The normalized capability vocabulary is:

- `text_chat`: interactive tutor and conversational text.
- `content_generation`: reviewed drafts and structured content assistance; never automatic publishing.
- `speech_to_text`: transcription with honest provider-supported confidence/timing.
- `text_to_speech`: synthetic audio from a resolved voice profile.
- `pronunciation_analysis`: provider-measured pronunciation evidence, which may be unavailable even when STT exists.

Provider and model records declare capabilities separately. An adapter may implement one or several interfaces from `src/lib/ai/contracts.ts`. Unsupported capabilities fail before a vendor request is made.

## Adapter and orchestration boundary

Adapters translate normalized requests into vendor SDK/API requests and normalize responses. They may expose vendor metadata only through validated extension fields. Vendor exceptions become safe internal error codes; raw responses and credentials are not returned to the browser.

Feature services call an orchestrator by stable feature key. The orchestrator:

1. loads the feature route and required capability;
2. selects the enabled primary provider/model;
3. resolves an opaque credential server-side;
4. enforces request validation, timeout, rate/cost policy, and idempotency where applicable;
5. invokes the adapter and validates its normalized result;
6. records redacted usage/health information;
7. attempts eligible fallbacks in configured order.

Fallback is allowed for transient availability, timeout, or explicitly mapped quota failures. Authentication errors, invalid requests, safety rejections, and deterministic application errors should normally stop. Non-idempotent generation must not be repeated unless its operation is designed for safe retry. The result records which provider/model actually served it, but business logic must not change based on brand.

## Provider administration plan

Authorized admins will eventually be able to:

- add a named provider connection and submit a credential;
- test the connection through a bounded server-side request;
- enable/disable the provider and individual discovered/configured models;
- see each model's normalized capabilities;
- assign a primary provider/model per application feature;
- order compatible fallback provider/models;
- view basic request, latency, error, and provider-reported unit usage.

Connection tests must have strict timeouts and rate limits, must not persist arbitrary provider response bodies, and must return only redacted errors. Testing a custom endpoint is an SSRF-sensitive action: require HTTPS by default, validate DNS/IP targets on every connection, reject redirects to disallowed networks, and use an operator allowlist for any trusted private endpoint.

Model discovery is advisory. Admin selection must still validate adapter capability and enabled state. Store immutable vendor model IDs separately from editable display names. Do not silently replace a configured model when a vendor changes its catalog.

## Credential security

Environment-only credentials may be supported for deployments that do not want database-managed secrets. Database-managed credentials require:

- server-only acceptance and decryption;
- authenticated encryption (planned AES-256-GCM) before persistence;
- a random `APP_ENCRYPTION_KEY` held outside MySQL and separate from `AUTH_SECRET`;
- a versioned envelope/key version for rotation;
- no plaintext/ciphertext in browser responses, logs, analytics, errors, or audit details;
- masked metadata only, such as credential label, type, presence, creation/rotation time, and last successful test;
- overwrite/rotate and delete operations rather than a "reveal secret" endpoint;
- audited admin actions without recording secret values.

The encryption service owns key parsing, encryption, decryption, and rotation. Provider adapters receive a short-lived in-memory secret from the server credential resolver and must not cache it globally. Database and media backups remain sensitive even when secrets are encrypted.

Official OpenAI documentation demonstrates loading keys from server environment variables. The same server-only principle applies to every provider credential; vendor-specific secret handling belongs inside its adapter.

## Usage and cost records

Record correlation ID, provider/model, feature, capability, start/end time, status, latency, fallback position, and provider-reported tokens/characters/audio duration when available. Do not record prompts, transcripts, generated content, learner identity, or audio in the usage table by default.

Costs computed from locally configured prices are estimates, not billing truth. Label them accordingly and keep the price snapshot/currency used. Provider dashboards/invoices remain authoritative. Define retention and aggregation before production use.

## Voice profiles

A voice profile describes synthetic presentation, not teaching behavior. Generic fields include name, provider connection, provider voice ID, language, speaking rate, optional style/instructions, TTS purpose, enabled state, and validated provider-specific metadata.

Initial examples may include:

- Adult Arabic Teacher
- Child Friendly
- Slow Arabic Pronunciation
- Conversation Tutor

Purposes include reference pronunciation, slow pronunciation, lesson narration, conversation tutor, and feedback. Assignment rules can scope a profile by student mode (`standard`/`child`), course, activity type, and purpose. Resolution uses the most specific compatible enabled rule, then explicit priority and a stable tie-breaker. If no valid match exists, fail safely rather than selecting an arbitrary provider voice.

A child-friendly profile is an age-appropriate, friendly or youthful synthetic presentation where the provider supports it. It must not require cloning or impersonating a real child's voice. Provider terms and consent requirements still apply.

Reference pronunciation prioritizes linguistic accuracy and reviewed pronunciation quality. A child learner can therefore use a friendly narrator for lesson feedback and a different accurate Arabic reference voice for listen/repeat exercises.

## Teaching style is separate

Teaching/personality style controls explanation complexity, Bangla tone, encouragement, age appropriateness, and tutor instructions. It is resolved before text/content generation and has no provider voice ID, speaking rate, or TTS metadata.

Generated text and TTS form two explicit steps:

1. resolve teaching style and produce/validate the explanation;
2. resolve voice profile for the language, learner context, activity, and purpose, then synthesize it.

This separation prevents a "child" setting from weakening Arabic pronunciation accuracy or coupling pedagogy to one TTS vendor.

## Pronunciation integrity

Keep these outputs distinct:

1. provider speech recognition and its actual confidence/timing;
2. deterministic expected-versus-recognized text comparison;
3. provider pronunciation measurements, if genuinely supplied;
4. AI-generated Bangla coaching, labeled as coaching rather than measurement.

Every pronunciation result includes an evidence kind. Never synthesize phoneme scores from a generic language model or present an AI estimate as acoustic analysis. Low-confidence attempts return an honest retry state.

## Phase boundaries

- Phase 1: finalize and migrate provider, encrypted credential, model/capability, route/fallback, usage/check, voice profile/assignment, and teaching-style records; implement/test encryption primitives. No provider admin UI.
- Phase 4: implement speech/pronunciation adapters, voice resolution, audio privacy, and reference audio caching.
- Phase 5: implement provider-neutral tutor/content orchestration, teaching-style resolution, routing/fallback, and safety/cost controls.
- Phase 6: implement provider/model/credential/route/voice administration and basic usage views.
