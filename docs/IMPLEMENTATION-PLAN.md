# Implementation Plan

## Phase 0 — Foundation (current)

- Repository, Next.js App Router, strict TypeScript, Tailwind CSS.
- Central branding, typed Bangla/English localization scaffold, Arabic font/RTL proof.
- Vitest, Playwright configuration, lint/typecheck/build scripts, GitHub CI.
- Standalone Node build and Passenger entrypoint.
- Environment, architecture, database, security, and deployment documentation.
- Secure cPanel first-run bootstrap mode, private runtime configuration, fixed migrations/base seed, and initial super-admin login.

No course data, learning product routes, AI tutoring calls, speech processing, or full admin functionality belongs in the foundation. The installer is the narrow exception needed to make cPanel deployment operational.

## Phase 1 — Data and identity foundation

Confirm production MariaDB/MySQL capabilities; extend the installer foundation with user profiles, complete Auth.js account/session requirements, roles, audit, and foundational course tables. Add provider model/capability, feature route/fallback, usage/check, voice assignment, and teaching-style schemas. Implement registration, email verification/reset, authorization primitives, storage provider interface, deployment-safe Prisma repositories, and credential rotation. Do not build the full provider admin UI or learning AI calls in this phase.

## Phase 2 — Course and content engine

Implement generic course hierarchy, localized content, lesson block schemas/rendering, Arabic text primitives, editorial validation, seed languages, and the initial reviewed Arabic Foundation structure.

## Phase 3 — Student learning loop

Implement onboarding, enrollment, dashboard, lesson navigation, generic exercises, server-side scoring, progress ledger, goals, streaks, achievements, and accessible mobile UX.

## Phase 4 — Audio and pronunciation

Implement microphone capture, upload limits, temporary processing, provider-neutral STT/TTS/pronunciation adapters, voice-profile resolution, deterministic comparison, honest confidence handling, Bangla coaching, reference audio caching, derived result storage, and privacy tests. Do not claim phoneme accuracy without a provider that measures it.

## Phase 5 — Review and AI tutor

Implement documented spaced repetition, review sessions, provider-neutral server-side tutor/content generation with constrained context and structured outputs, feature routing/fallback, rate/cost controls, safety policies, teaching-style resolution, and progress isolation.

## Phase 6 — Admin and production hardening

Implement admin content workflows and AI provider management: add/rotate credentials, test connections, enable providers/models, choose per-feature defaults and fallbacks, manage voice profiles/assignments, and view basic usage. Add publishing/review, audit tooling, observability, backup/restore drills, accessibility/performance/security review, load tests, and full cPanel release rehearsal.

Every phase ends with lint, strict typecheck, unit/integration tests, relevant end-to-end coverage, a production build, updated documentation, and a rollback-aware deployment note.
