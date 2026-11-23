# Life Pulse

**Privacy-first, zero-input Life Admin Autopilot** — mobile-first PWA & web app built for US/UK/EU (GDPR-native) and ready for India.

## Core Principles
- **Privacy First (GDPR Native):** Default ingestion is **Private Auto-Forwarding** + **Mobile Snap**. Raw email bodies are parsed in-memory and discarded immediately.
- **Subscription-Ready Foundation:** Provider-agnostic `plan_tier` (`free` | `solo_pro` | `household`) and centralized `src/lib/entitlements.ts` so Stripe/Paddle can be plugged in via webhook without app refactoring.
- **Day-1 Household Abstraction:** Every user starts with a 1-person household so inviting a partner in Phase 2 requires zero schema migration.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, PWA manifest
- **Backend / DB / Auth / Storage:** Supabase (`eu-west-1` Ireland) with strict Postgres RLS + private `vault-documents` bucket
- **Validation & Extraction:** Zod strict extraction contract + deterministic merchant parsers + regional return-window rules

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env.local

# 2. Install dependencies
pnpm install

# 3. Run local dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) for branching strategy, conventional commits, and PR checklist.
