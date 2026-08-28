# Implementation Plan

## Phase 0 — Foundation (complete)

- Repository, Next.js App Router, strict TypeScript, Tailwind CSS.
- Central branding, typed Bangla/English localization scaffold, Arabic font/RTL proof.
- Vitest, Playwright configuration, lint/typecheck/build scripts, GitHub CI.
- Standalone Node build and Passenger entrypoint.
- Environment, architecture, database, security, and deployment documentation.
- Secure cPanel first-run bootstrap mode, private runtime configuration, fixed migrations/base seed, and initial super-admin login.

No course data, learning product routes, AI tutoring calls, speech processing, or full admin functionality belongs in the foundation. The installer is the narrow exception needed to make cPanel deployment operational.

## Phase 1 — Data and identity foundation (complete)

The installer schema is extended by a backward-compatible migration with student profiles, role/status/session controls, reset/verification/invitation records, course hierarchy and enrollment, provider feature routes/fallbacks, voice assignments, teaching styles, media metadata, and durable rate limits. Auth.js login/logout, student signup, password reset through provider-neutral SMTP email, server authorization helpers, typed settings, and safe local storage are implemented. Verification/invitation persistence is prepared; delivery workflows and full UI remain later work.

## Phase 2 — Student onboarding and learning dashboard (complete)

Implemented the localized authenticated learner shell, deterministic onboarding, idempotent initial enrollment, database-backed dashboard, course overview over enrolled/published content, profile/settings management, timezone-aware daily activity/streak foundations, lesson progress, and an idempotent XP ledger. Empty states remain explicit because Phase 2 does not fabricate lessons or progress.

## Phase 3 — Course content and lesson learning loop (complete)

Implemented a published Arabic Foundation path with reusable validated lesson blocks, Arabic typography/content primitives, ten letter records, first harakat and greeting content, server-scored multiple choice, persisted attempts, deterministic lesson access, transactional completion, idempotent XP, learner-local activity, next-lesson advancement, and real dashboard/course progress. Advanced exercises, goals/review scheduling, and achievements remain later work.

## Phase 4 — Audio and pronunciation

Implement microphone capture, upload limits, temporary processing, provider-neutral STT/TTS/pronunciation adapters, voice-profile resolution, deterministic comparison, honest confidence handling, Bangla coaching, reference audio caching, derived result storage, and privacy tests. Do not claim phoneme accuracy without a provider that measures it.

## Phase 5 — Review and AI tutor

Implement documented spaced repetition, review sessions, provider-neutral server-side tutor/content generation with constrained context and structured outputs, feature routing/fallback, rate/cost controls, safety policies, teaching-style resolution, and progress isolation.

## Phase 6 — Admin and production hardening

Implement admin content workflows and AI provider management: add/rotate credentials, test connections, enable providers/models, choose per-feature defaults and fallbacks, manage voice profiles/assignments, and view basic usage. Add publishing/review, audit tooling, observability, backup/restore drills, accessibility/performance/security review, load tests, and full cPanel release rehearsal.

Every phase ends with lint, strict typecheck, unit/integration tests, relevant end-to-end coverage, a production build, updated documentation, and a rollback-aware deployment note.
