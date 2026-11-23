# Life Pulse — Product Vision, Strategy & Roadmap

## 1. The Problem We Solve
Personal and household **"life admin"** is fragmented across email inboxes, PDFs, screenshots, and paper bills:
- Free trials silently converting into expensive annual subscriptions
- Missed e-commerce return windows
- Insurance, utility, and policy auto-renewals with hidden price hikes
- Lost receipts and warranties when an appliance or gadget breaks

Existing apps either require tedious manual data entry (which users abandon in Week 1) or demand full read/write access to a user's personal email inbox (which kills trust, especially in the UK/EU).

---

## 2. Positioning & Defensibility ("Anti-Vibe-Code" Moat)
Life Pulse is a **mobile-first web app (PWA)** built around four durable moats:
1. **Privacy-First Zero-Input Ingestion (Default):** Every user receives a private forwarding alias (`lp-xxxx@in.lifepulse.app`) + 1-click Gmail/Outlook/Apple Mail filter + Mobile Snap for paper bills. **Raw email bodies are parsed in-memory and discarded immediately.**
2. **24/7 Background Plumbing:** Continuous merchant parsing, regional return-window calculation, price-hike detection, and timezone-aware daily morning digests.
3. **Compounding System of Record:** Once a household's warranties, renewals, and obligations live in Life Pulse, switching costs grow every month.
4. **Shared Household Coordination (Phase 2):** Multi-party sync between partners turns a personal utility into a sticky daily household habit.

---

## 3. Target Markets (Global-Ready from Day 1)
* **Initial Launch:** **US, UK, and EU** (hosted in Supabase `eu-west-1` Ireland for GDPR data residency from Day 1).
* **Expansion Market:** **India** (multi-currency `USD`, `GBP`, `EUR`, `INR`, regional `MM/DD` vs `DD/MM` locale handling, 7-day India e-commerce return defaults, and Phase 3 WhatsApp forwarding ingestion).

---

## 4. V1 Scope & Daily Habit Loop
V1 focuses tightly on **4 high-ROI item types**:
1. **Subscriptions & Free Trials** — recurring amount, cycle, next charge, trial conversion countdown, price-hike flag.
2. **Orders & Return Windows** — merchant, amount, regional return deadline countdown (14d EU/UK statutory, 30d US, 7d India).
3. **Bills & Policy Renewals** — utilities, rent, car/home insurance due-date reminders.
4. **Warranty & Receipt Vault** — encrypted private document storage (`vault-documents`) with instant plain-English full-text search.

### The Daily Loop ("Today's Pulse")
Every morning, users open one calm screen showing only what matters today:
- **Quick Confirm (`< 0.75` AI confidence):** 1-tap verification queue so uncertain extractions never pollute the feed.
- **Needs Action Soon:** Expiring return windows, trials ending in ≤3 days, bills due.
- **1-Tap Resolution:** Confirm, Mark Done, Snooze 2d, or Archive to Vault.

---

## 5. Ingestion Strategy
1. **Default & Recommended:** **Private Auto-Forwarding** (zero OAuth red tape, maximum privacy, instant onboarding via copyable search filter + live test).
2. **Companion Channel:** **Mobile Snap / PDF Upload** directly into the encrypted EU Vault.
3. **Optional Opt-In (Phase 3):** Read-only **Gmail / Outlook OAuth** for users who explicitly want 1-click historical backfill (after Google CASA Tier 2 security certification).

---

## 6. Subscription Base (Provider-Agnostic)
Payments are intentionally deferred until product-market fit, while subscription entitlements are enforced from Day 1 via `src/lib/entitlements.ts` and `households.plan_tier`:

| Tier | Target Price | Key Capabilities |
| :--- | :--- | :--- |
| **`free`** | £0 / \$0 | Auto-Forward + Mobile Snap, up to 5 active items, Daily Pulse, 10 Vault docs |
| **`solo_pro`** | £8 / \$9 mo | Unlimited items & Vault docs, price-hike & return alerts, 1-tap AI cancel/return drafts, optional OAuth |
| **`household`** | £12 / \$14 mo | Everything in Solo Pro for up to 4 members, shared Daily Pulse, partner task handoffs, shared Vault |

---

## 7. Phased Roadmap

### Phase 1 — Solo MVP (Current)
- [x] Supabase EU (`eu-west-1`) database with GDPR schema, strict RLS, and private Vault storage
- [x] Next.js 15 mobile-first PWA + GitHub Actions CI
- [x] Privacy-first onboarding (Auto-Forward default + copyable filter wizard + 1-tap test + Mobile Snap)
- [x] Today's Pulse, Quick Confirm, Vault full-text search, GDPR JSON export & erasure requests
- [ ] Live inbound email webhook (Postmark/Resend) + structured LLM extraction fallback
- [ ] Timezone-aware 8:00 AM daily briefing jobs (Web Push + email digest)
- [ ] Production deployment on Vercel

### Phase 2 — Retention Multiplier & Monetization
- [ ] Shared Household Mode (partner invite links via `household_invites`, shared Pulse, task assignment)
- [ ] 1-tap AI action drafts (`item_actions`: cancel subscription, start return, dispute price hike)
- [ ] Automatic price-hike detection (`item_price_history` diffing)
- [ ] Connect billing provider (Stripe / Paddle webhook updating `households.plan_tier`)

### Phase 3 — Scale & Geographic Expansion
- [ ] Optional read-only Gmail & Outlook OAuth sync (post-CASA certification)
- [ ] WhatsApp forwarding bot for India & EU markets
- [ ] Extensible life categories (`travel_booking`, `car_maintenance`, `school_notice`, `tax_deadline`) — already supported by the schema with zero DB migrations
