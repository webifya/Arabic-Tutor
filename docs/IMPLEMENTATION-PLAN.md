# Implementation Plan

## Phase 0 — Foundation (current)

- Repository, Next.js App Router, strict TypeScript, Tailwind CSS.
- Central branding, typed Bangla/English localization scaffold, Arabic font/RTL proof.
- Vitest, Playwright configuration, lint/typecheck/build scripts, GitHub CI.
- Standalone Node build and Passenger entrypoint.
- Environment, architecture, database, security, and deployment documentation.

No database schema, auth flows, product routes, course data, AI calls, speech processing, or admin functionality belongs in Phase 0.

## Phase 1 — Data and identity foundation

Confirm production MariaDB/MySQL capabilities; design and migrate language, user/profile, role, Auth.js, settings, audit, and foundational course tables. Implement authentication, email verification/reset, authorization primitives, storage provider interface, and deployment-safe database access.

## Phase 2 — Course and content engine

Implement generic course hierarchy, localized content, lesson block schemas/rendering, Arabic text primitives, editorial validation, seed languages, and the initial reviewed Arabic Foundation structure.

## Phase 3 — Student learning loop

Implement onboarding, enrollment, dashboard, lesson navigation, generic exercises, server-side scoring, progress ledger, goals, streaks, achievements, and accessible mobile UX.

## Phase 4 — Audio and pronunciation

Implement microphone capture, upload limits, temporary processing, speech-to-text provider, deterministic comparison, honest confidence handling, Bangla coaching, reference TTS/cache, derived result storage, and privacy tests. Do not claim phoneme accuracy without a provider that measures it.

## Phase 5 — Review and AI tutor

Implement documented spaced repetition, review sessions, server-side OpenAI tutor with constrained context and structured outputs, rate/cost controls, safety policies, and progress isolation.

## Phase 6 — Admin and production hardening

Implement admin content workflows, publishing/review, audit tooling, observability, backup/restore drills, accessibility/performance/security review, load tests, and full cPanel release rehearsal.

Every phase ends with lint, strict typecheck, unit/integration tests, relevant end-to-end coverage, a production build, updated documentation, and a rollback-aware deployment note.
