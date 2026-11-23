## Summary
- What changed and why?

## Type of Change
- [ ] Feature (`feat`)
- [ ] Bug fix (`fix`)
- [ ] Database migration / RLS change
- [ ] Refactor / Chore

## Privacy, Security & Quality Checklist
- [ ] Unit tests added/updated for all new logic and bug fixes
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` pass locally
- [ ] No secrets or raw email bodies logged or persisted
- [ ] Any new DB tables have RLS enabled (`TO authenticated`) and FK indexes
- [ ] Subscription-gated behavior routes through `src/lib/entitlements.ts`
- [ ] Tested on mobile viewport (375px) and desktop
