# Lisan

**আরবি শিখুন সহজভাবে**

Lisan is an AI-assisted language-learning platform. Its first product is Arabic Foundation for Bangla-speaking learners, while its course, exercise, progress, localization, speech, and AI boundaries are designed for future language pairs.

This repository currently contains **Phase 0 only**: the application and repository foundation. Authentication, database models and migrations, course content, learning features, AI calls, speech processing, and admin features are intentionally not implemented yet.

## Stack

- Next.js App Router, React, strict TypeScript, Tailwind CSS
- Standard Node.js runtime with Next.js standalone output
- MySQL/MariaDB through Prisma (schema begins in a later phase)
- Auth.js/NextAuth.js (integration begins in a later phase)
- cPanel/local storage behind a future provider interface
- OpenAI through server-only provider modules
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
- [Database design](docs/DATABASE.md)
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [cPanel deployment](docs/DEPLOY-CPANEL.md)
- [Security](docs/SECURITY.md)
- [Contributor/agent guidance](AGENTS.md)

## Scope guard

The final infrastructure decision overrides older Supabase references: use MySQL/MariaDB, Prisma, Auth.js, cPanel/local storage abstraction, cPanel Node.js/Passenger, and server-side OpenAI. Do not add Supabase dependencies or assumptions.
