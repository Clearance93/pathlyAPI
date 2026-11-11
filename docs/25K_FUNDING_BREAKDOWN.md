# PathlyAI — R25,000 Scope & Funding Breakdown

**Prepared:** 29 October 2026  
**Product:** PathlyAI — AI career guidance for Grade 11/12 learners  
**Code:** `pathlyAPI` (Angular 21 frontend) + `PathlyAI_API` (.NET 10 API)  
**Ask:** R25,000 to take PathlyAI from "working demo" to "first paying customers"  
**Basis:** 50 hours at a blended R450/hour, including contingency and R2,500 of infrastructure/AI credits

> If the R25,000 is in another currency, the hours and work packages stay the same. Only the
> rate line changes.

---

## 1. The ask in one paragraph

PathlyAI already analyses a learner's matric results, produces a full career and university
report, runs a psychometric assessment, and fuses the two into a combined report. The frontend
and backend are built, tested and deployed. What is missing is the unglamorous last mile:
live email, live payments, reliable hosting and the tests that prove money can change hands
without breaking. R25,000 funds that last mile over six weeks, with a working, chargeable
product at the end — not a prototype.

---

## 2. What already exists (so the money is not funding a maybe)

| Area | Current state | Evidence |
|---|---|---|
| Academic analysis | Upload PDF/JPG/PNG → OCR/extraction → AI report with APS, career matches, university eligibility, outlook | 22 API endpoints, Groq `openai/gpt-oss-120b` with fallback keys |
| Report quality guards | Deterministic subject sanitizer, extraction validator, career-path coherence guard, progression engine | Backend tests reproduce the "napping" and "UCT robotics + UP mechanical" review cases |
| Auth | Register/login, JWT access token, rotating refresh token in httpOnly cookie, rate limiting, password reset, email verification, Cloudflare Turnstile (wired, currently disabled) | `AuthenticationController` (8 endpoints) |
| Persistence | EF Core + SQL Server, per-user reports, history, APS trend, next-term projection, combined report | `AcademicAnalysisController`, migrations, IDOR fixes |
| Billing | Server-owned plan catalogue and usage, Paystack checkout + webhook | `BillingController`, `PlansController` |
| POPIA | Consent at registration, data export, account deletion, Terms and Privacy pages, Information Officer details | `AccountController`, `/privacy` |
| Quality | 106 backend tests, 19 frontend tests, CI on both repos, 0-warning build | `Pathly Tests`, GitHub Actions |
| Frontend | 14 routes, 11 services, Angular 21 + SSR, Netlify deployment | `src/app/app.routes.ts` |
| Scale of code | 12 backend projects, 285 C# files, 6 API controllers; Angular app with standalone components and signals | Repos |

**Translation:** the product builds, tests and deploys today. The gap is commercial readiness,
not core functionality.

---

## 3. The actual gap (what the R25,000 fixes)

### Priority 0 — blocks taking real money

1. **Live payments.** Paystack is wired but the secret key is empty and the webhook has never
   been exercised end-to-end. Until a sandbox purchase upgrades an account and a real payment
   does the same, there is no revenue.
2. **Live email.** SMTP settings exist but are blank, so password resets and verification emails
   only log. Account recovery is impossible for a real user.
3. **Reliable hosting.** The production API currently points at a free MonsterASP host. Free
   tiers cold-start, throttle and sleep — fatal for checkout redirects and Paystack webhooks.
4. **Secrets and bot protection.** Turnstile is implemented but disabled; keys and connection
   strings need to live in the host's secret store, not in files.

### Priority 1 — protects revenue once it starts

5. **AI cost guardrails.** Per-plan usage caps, timeouts, retries and a cheap-model fallback so
   one abusive upload cannot burn the AI budget.
6. **End-to-end tests on the money paths.** Register → pay → upgrade → generate report, plus
   webhook replay and failed-payment handling.
7. **Observability and backups.** Structured logs, uptime/error alerts, database backup and a
   tested restore.

### Priority 2 — deliberately deferred

8. **School bulk upload and school/teacher dashboard.** The customer-facing plans are Free,
   Standard and Premium; `school` is a legacy code normalised to Premium. Building a school
   dashboard would consume most of this budget for a product nobody is being sold yet. Defer to
   Phase 2.
9. **Legacy EF entity cleanup.** Migration-history housekeeping, not customer value.

---

## 4. Work breakdown — 50 hours

| # | Work package | Hours | Rate | Cost |
|---|---|---|---|---|
| WP1 | Production go-live hardening | 8 | R450 | R3,600 |
| WP2 | Backend completion (email, payments, AI limits, cleanup) | 14 | R450 | R6,300 |
| WP3 | Frontend completion and payment UX | 8 | R450 | R3,600 |
| WP4 | QA and automated tests on revenue paths | 6 | R450 | R2,700 |
| WP5 | Security, POPIA and observability | 5 | R450 | R2,250 |
| WP6 | Documentation, handover and deploy runbook | 3 | R450 | R1,350 |
| | **Subtotal** | **44** | | **R19,800** |
| | Contingency (6 h) | 6 | R450 | R2,700 |
| | Infrastructure and AI credits | | | R2,500 |
| | **Total** | **50** | | **R25,000** |

The hourly rate is an internal estimating basis, not a quote. The ask can be presented as three
fixed-price milestones instead.

### WP1 — Production go-live hardening (8 h)

- Move the API off the free host to a paid tier with always-on workers and a stable domain.
- Put JWT key, database connection string, Groq keys, Paystack secret, SMTP password and
  Turnstile secret into host environment variables / secret storage.
- Enable Turnstile (`Turnstile:Enabled=true`) and verify registration rejects missing tokens.
- Lock CORS to the production frontend origin only.
- Add a `/health` and version endpoint so a deploy can be proven current.
- Apply all EF migrations to the production database from CI, not by hand.

**Done when:** a cold-start-free production deploy serves the current `master`, secrets are not
in the repo, and bot registration fails without a valid Turnstile token.

### WP2 — Backend completion (14 h)

- **SMTP (3 h):** configure a transactional provider, send reset/verification mail, set
  `Auth:RequireConfirmedEmail=true`, test expiry and resend.
- **Payments (6 h):** live Paystack keys, signature verification, idempotent webhook handling,
  plan entitlement on successful charge, failed/cancelled payment state, refund/cancellation
  path documented.
- **AI limits (3 h):** per-plan report quotas enforced server-side, request timeout, retry with
  fallback key, and a per-report cost log.
- **Cleanup (2 h):** remove legacy entities in a dedicated migration, confirm the 106 tests
  still pass and add tests for the new billing and email paths.

**Done when:** a sandbox purchase upgrades the account, a replayed webhook does not double-credit,
a failed payment leaves the account on Free, and reset/verification emails arrive.

### WP3 — Frontend completion (8 h)

- Payment page: real pending/success/failed states, return-from-Paystack handling, retry.
- Upgrade page: plans and prices read from the server with a safe fallback, no hard-coded drift.
- Empty, loading and error states for history, report reopen and combined report.
- Mobile pass on upload, report and payment (the majority of learners are on phones).
- Accessibility basics: labels, focus order, contrast, keyboard on the payment flow.

**Done when:** a learner can register, pay, return and see their upgrade on a phone without a
developer present.

### WP4 — QA and automated tests (6 h)

- Playwright end-to-end: register → verify → login → upload sample results → report.
- Playwright end-to-end: register → pay (sandbox) → upgrade → Premium report.
- Webhook replay, invalid signature and cancelled-payment tests.
- Regression pass on the shared-device and per-user data-scoping fixes.
- Cross-browser smoke: Chrome, Edge, Safari/iOS.

**Done when:** CI runs the revenue-path suite on every push and both suites are green.

### WP5 — Security, POPIA and observability (5 h)

- Dependency and secret scan; rotate anything ever committed.
- Data retention note, backup schedule and one tested restore.
- Structured logs with request IDs, error alerting, uptime monitor.
- Re-verify data export and account deletion after the new billing tables are added.

**Done when:** an alert fires on a forced 500, a backup restores to a scratch database, and
delete-account removes billing and report rows.

### WP6 — Documentation and handover (3 h)

- One-page deploy/runbook: hosts, env vars, migrations, rollback, where money and mail are
  configured.
- Update `DOCUMENTATION.md` and `REVIEW-RESULTS.md` to match reality.
- 30-minute handover call and a written "known limitations" list.

**Done when:** a second developer can deploy from a clean clone using only the runbook.

---

## 5. Milestones and payment schedule

| Milestone | Scope | Exit criteria | Payment |
|---|---|---|---|
| M1 — Kickoff | WP1 + start WP2 | Production host live, secrets set, Turnstile on, plan agreed | R7,500 (30%) |
| M2 — Chargeable | WP2 + WP3 | Sandbox payment upgrades an account, emails deliver, payment UX complete | R10,000 (40%) |
| M3 — Handover | WP4 + WP5 + WP6 | Revenue-path E2E green, alerts and backup proven, runbook delivered | R7,500 (30%) |

Weekly demo, shared board and repo access throughout. No payment without the exit criteria
being shown in the deployed environment.

---

## 6. Six-week plan

| Week | Focus | Demo at end of week |
|---|---|---|
| 1 | WP1, kickoff, host and secrets | Current build on paid host, health endpoint, bot protection on |
| 2 | WP2 email + AI limits | Reset and verification email arrives; quota blocks the 11th report |
| 3 | WP2 payments | Sandbox purchase upgrades an account; replay does not double-credit |
| 4 | WP3 frontend | Full phone flow: register → pay → Premium report |
| 5 | WP4 + WP5 | Revenue-path E2E green in CI; alert and restore demonstrated |
| 6 | WP6 + contingency | Runbook, handover call, public launch checklist |

Part-time delivery is assumed. Full-time would compress this to roughly three weeks.

---

## 7. How the person funding this can verify it

- **Repos and CI:** both repos are on GitHub with green build/test workflows.
- **Live demo:** a seeded learner account and a sandbox Paystack test card.
- **Tests:** 106 backend + 19 frontend today; the revenue-path suite is added by WP4.
- **Before/after checklist:** every work package has a written "done when" above.
- **Success measures after launch:** first paid subscription, report success rate above 95%,
  p95 report time under 60 seconds, AI cost per report within the R2,500 monthly credit line.

---

## 8. What is not included

- Hosting, domains, AI usage, email and Paystack fees beyond the R2,500 line.
- Legal review of the Terms/Privacy text (the pages exist; a lawyer should still sign them off).
- Paid design/branding, app-store publishing, marketing or content writing.
- The school/teacher dashboard and bulk upload (Phase 2).
- New AI features, extra assessments or integrations.
- Refunds and chargeback handling beyond the payment state machine.

Anything outside this list is a written change request with its own estimate.

---

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Paystack KYC/approval delay | Blocks revenue | Start approval day 1; build and test against sandbox meanwhile |
| AI cost overrun | Margin erosion | Per-plan quotas, timeouts, fallback model, cost logging |
| Free-host limits/cold starts | Failed checkouts, missed webhooks | WP1 moves to paid always-on hosting |
| Scope creep | Budget exhausted early | Fixed packages, written change requests, Phase 2 list |
| Single developer / bus factor | Delivery risk | Runbook, CI, handover, repo access from day 1 |
| Stale deployment (already seen once) | Reviewers test old code | Deploy only from CI, expose build version endpoint |
| Payment webhook abuse | Free upgrades | Signature verification, idempotency keys, alerting |

---

## 10. If you are the one asking

Short version you can send:

> I've built PathlyAI, an AI career-guidance app for matric learners. The product works end to
> end — analysis, reports, psychometric assessment, accounts and POPIA compliance — with 106
> backend tests and a live frontend. I need R25,000 to finish the commercial last mile: live
> email, live Paystack payments, reliable hosting, security hardening and end-to-end tests,
> delivered over six weeks in three paid milestones. I can show you the repos, the test results
> and a working demo before you commit anything.

Attach: this document, the live demo link, the two repo links, and the CI run showing 106
passing backend tests.

---

## 11. Decisions to confirm before sending

1. **Currency and rate.** R25,000 ZAR at R450/h is assumed. USD/NGN or a different rate changes
   the table, not the scope.
2. **Who does the work.** The hours assume one developer. If you are doing it yourself, the
   R19,800 becomes your time and the cash portion is mostly infrastructure.
3. **Launch date.** Six weeks part-time; a hard date compresses scope, not hours.
4. **School features.** Confirm they are Phase 2, otherwise the payment/hosting work does not fit
   in R25,000.
5. **Hosting budget.** R2,500 assumes a small paid API host, database, transactional email and AI
   credits for the first two to three months.

---

## Appendix — API surface covered by this scope

`Authentication` (register, login, refresh, logout, forgot/reset password, confirm email, resend)
· `AcademicAnalysis` (analysis, premium analysis, psychometric analysis, history, report by id,
combined analysis) · `Psychometric` (submit, me) · `Billing` (usage, checkout, Paystack webhook)
· `Plans` (catalogue) · `Account` (data export, delete).
