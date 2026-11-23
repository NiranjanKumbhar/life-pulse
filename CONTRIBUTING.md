# Contributing to Life Pulse

## Branching Strategy
- `main` is always deployable and protected.
- Create short-lived feature branches from `main`:
  - `feat/<short-description>` (new user-facing feature)
  - `fix/<short-description>` (bug fix)
  - `chore/<short-description>` (tooling, deps, docs)

## Conventional Commits
Use clear, imperative commit messages:
- `feat(pulse): add 1-tap snooze action on daily cards`
- `fix(rls): ensure household_invites update checks owner role`
- `chore(ci): add typecheck step to GitHub Actions`

## Security, Testing & Privacy Rules (Mandatory)
1. **Always add/update unit tests** (`pnpm test`) whenever you complete any feature or bug fix.
2. **Never** commit `.env.local` or any `service_role` / secret key.
3. **Never** store raw email bodies in Postgres or logs.
4. Every new table in `public` **must** enable RLS (`TO authenticated`, `(select auth.uid())`) and pass Supabase Security Advisors.
5. Every new feature gated by subscription tier **must** check `src/lib/entitlements.ts` rather than hardcoding plan checks.
