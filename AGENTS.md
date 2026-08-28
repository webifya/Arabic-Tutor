# AGENTS.md

## Product and source of truth

Lisan is a multilingual learning platform whose first course is Bangla → Arabic Foundation. Preserve natural Bangladeshi Bangla, accessible mobile-first UX, correct embedded Arabic RTL, and the pronunciation-feedback loop as the long-term differentiator. Repository documentation is the source of truth; the infrastructure decision in `README.md` overrides older Supabase references.

## Architecture rules

- Use Next.js App Router and standard Node.js APIs; never require Edge or Vercel-only infrastructure.
- Keep presentation, server business logic, database access, storage, auth, speech, and AI providers separated.
- Model languages and translations generically. A course references source and target languages; Arabic content is not UI localization.
- Keep UI strings in typed locale dictionaries (`bn`, `en`). Use `dir="rtl"` only on Arabic content.
- Keep branding in `src/config/app.ts` and environment settings, not scattered through components.
- AI/speech integrations are server-only, capability-based adapters under `src/lib/ai`; application features never select OpenAI, Gemini, Claude, or another vendor directly. AI never directly awards progress.
- Provider credentials stored in MySQL require authenticated encryption with the server-only `APP_ENCRYPTION_KEY`; never reveal or log plaintext/ciphertext. Keep teaching style separate from TTS voice profiles.
- Raw microphone audio is temporary by default and must be discarded after processing.

## Coding and quality

- TypeScript strict mode; validate untrusted boundaries with Zod.
- Prefer Server Components; add client components only when interaction requires them.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before committing. Add Playwright coverage for important user flows in their implementation phase.
- Update relevant docs with architectural, security, environment, schema, or deployment changes.

## Database policy

Use MySQL/MariaDB through Prisma. Never edit a deployed database manually. Schema changes require reviewed Prisma migrations, backward-compatible rollout planning, and documented backup/rollback steps. The first-run migration is limited to installer/identity/provider foundations; see `docs/DATABASE.md`.

## Security and deployment

Never commit secrets, `.env` files, `.runtime-config.json`, production data, or learner audio. Installer actions must recheck completion state, validate input, preserve fixed migration commands, and never expose reset/secret/SQL/shell/path controls. Authorize every post-install server mutation with helpers from `src/lib/auth/session.ts`, score progress server-side, rate-limit expensive/sensitive endpoints, and isolate user-owned media. Build with `output: "standalone"`; support cPanel Passenger and normal Node.js without Vercel-only services. See `docs/SECURITY.md`, `docs/AUTHENTICATION.md`, `docs/INSTALLER.md`, `docs/AI-SYSTEM.md`, and `docs/DEPLOY-CPANEL.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
