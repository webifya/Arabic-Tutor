# AGENTS.md

## Product and source of truth

Lisan is a multilingual learning platform whose first course is Bangla → Arabic Foundation. Preserve natural Bangladeshi Bangla, accessible mobile-first UX, correct embedded Arabic RTL, and the pronunciation-feedback loop as the long-term differentiator. Repository documentation is the source of truth; the infrastructure decision in `README.md` overrides older Supabase references.

## Architecture rules

- Use Next.js App Router and standard Node.js APIs; never require Edge or Vercel-only infrastructure.
- Keep presentation, server business logic, database access, storage, auth, speech, and AI providers separated.
- Model languages and translations generically. A course references source and target languages; Arabic content is not UI localization.
- Keep UI strings in typed locale dictionaries (`bn`, `en`). Use `dir="rtl"` only on Arabic content.
- Keep branding in `src/config/app.ts` and environment settings, not scattered through components.
- OpenAI calls are server-only and centralized under `src/lib/ai`; AI never directly awards progress.
- Raw microphone audio is temporary by default and must be discarded after processing.

## Coding and quality

- TypeScript strict mode; validate untrusted boundaries with Zod.
- Prefer Server Components; add client components only when interaction requires them.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before committing. Add Playwright coverage for important user flows in their implementation phase.
- Update relevant docs with architectural, security, environment, schema, or deployment changes.

## Database policy

Use MySQL/MariaDB through Prisma. Never edit a deployed database manually. Schema changes require reviewed Prisma migrations, backward-compatible rollout planning, and documented backup/rollback steps. Do not create the application schema during Phase 0; see `docs/DATABASE.md`.

## Security and deployment

Never commit secrets, `.env` files, production data, or learner audio. Authorize every server mutation, score progress server-side, rate-limit expensive/sensitive endpoints, and isolate user-owned media. Build with `output: "standalone"`; support cPanel Passenger and normal Node.js without Vercel-only services. See `docs/SECURITY.md` and `docs/DEPLOY-CPANEL.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
