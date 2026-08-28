# Lisan

**আরবি শিখুন সহজভাবে**

Lisan is an AI-assisted language-learning platform. Its first product is Arabic Foundation for Bangla-speaking learners, while its course, exercise, progress, localization, speech, and AI boundaries are designed for future language pairs.

This repository contains the secure cPanel installer and Phase 1 identity/domain foundation: Auth.js login and registration, password recovery, role enforcement, typed settings, local storage, reusable course tables, and provider-neutral routing records. Full learning, content, AI tutor, speech, and administration experiences remain deferred.

## Stack

- Next.js App Router, React, strict TypeScript, Tailwind CSS
- Standard Node.js runtime with Next.js standalone output
- MySQL/MariaDB through reviewed Prisma migrations
- Auth.js/NextAuth.js credentials sessions with server-side account checks
- cPanel/local filesystem behind a typed storage provider
- Provider-neutral AI and speech contracts with server-only OpenAI, Gemini, Claude, custom-compatible, and future adapters
- Vitest and Playwright

## Local setup

Requirements: Node.js 22.12+ LTS recommended. Node.js 20.19+ and Node.js 24 are also supported; odd-numbered releases are not production targets. Use npm 10+.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright browser installation may be required once: `npx playwright install chromium`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [AI, speech, and voice system](docs/AI-SYSTEM.md)
- [First-run web installer](docs/INSTALLER.md)
- [Database design](docs/DATABASE.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [cPanel deployment](docs/DEPLOY-CPANEL.md)
- [cPanel staging acceptance checklist](docs/STAGING-ACCEPTANCE.md)
- [Security](docs/SECURITY.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Contributor/agent guidance](AGENTS.md)

## Scope guard

The final infrastructure decision overrides older Supabase references: use MySQL/MariaDB, Prisma, Auth.js, cPanel/local storage abstraction, cPanel Node.js/Passenger, and provider-neutral server-side AI/speech integrations. Do not add Supabase dependencies or assumptions.
