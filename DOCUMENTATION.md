# PathlyAI Documentation

## 1. Overview

PathlyAI is a student-focused career guidance application built in Angular. It uses AI-powered analysis of academic results to help students discover career paths, university eligibility, and personalized advice.

The app provides:
- academic result upload as PDF/image
- AI analysis of matric results and grades
- suggested careers and university matches
- tiered subscription plans with free, Pro, and School access
- authentication via email/password with JWT tokens

## 2. Purpose

PathlyAI helps students who are unsure about their next career steps after school. The application aims to remove guesswork by turning academic performance into a clear career guidance report.

Target audience:
- Grade 11 and Grade 12 students
- career counsellors and teachers
- schools looking for group career support

## 3. Core Features

### 3.1 Student analysis

Students upload their academic results and the app sends that data to an AI service for analysis.

### 3.2 Personalized career guidance

Based on the AI results, PathlyAI produces:
- overall score
- academic personality
- strengths and weaknesses
- APS analysis and university qualification advice
- top career matches
- alternative career paths
- demanding and dying career alerts
- employment outlook

### 3.3 Subscription plans

Plans shown in the UI:
- Free plan: limited analyses, preview of results
- Pro plan: unlimited analyses, full report, strengths, alternative careers, feedback
- School plan: supports bulk usage, teacher features, and higher student volume

### 3.4 Authentication and access control

Users can:
- register with email and password (must accept the Terms & Privacy Policy; marketing is opt-in)
- sign in with email/password
- reset a forgotten password via an emailed link
- confirm their email address via an emailed verification link
- maintain session data (JWT) in localStorage
- access the upload/analyze page only when authenticated

Auth endpoints are rate-limited, and the account id used for every stored result/assessment comes
from the JWT — never from the request body — so one user can never read or write another's data.

### 3.5 Persistent, per-user reporting

Every generated report is stored on the server against the signed-in account. Users can:
- reopen any previous report from their Analysis History (newest first)
- see an APS-progress trend across their uploads
- view a deterministic next-term projection when their document contains term history
- combine their stored academic record with their stored career-interest assessment (Pro)

## 4. User Journey

### 4.1 Home page

The landing page explains the service, showcases benefits, and presents pricing. Students can start a free analysis or upgrade directly.

### 4.2 Register/Login

New users register for an account and choose a plan. Existing users sign in to continue.

### 4.3 Upload results

Authenticated users reach the `/analyze` page.
- upload PDF, JPG, JPEG, or PNG
- file size limit ~1.5 MB
- image files are optionally compressed on the client

### 4.4 View report

After analysis, users see a results page that changes depending on plan level.
- free users see a preview and can upgrade
- Pro/School users see the full report

### 4.5 Upgrade path

Users can navigate to the pricing/upgrade flow and submit payment details.
- payment is currently simulated in the frontend
- successful payment updates the user plan and grants full access

## 5. Application Pages and Routes

### 5.1 `/`
Home landing page with hero, features, testimonials, and pricing.

### 5.2 `/analyze`
Upload and analysis page. Protected by `authGuard`.

### 5.3 `/register`
Registration page with plan selection.

### 5.4 `/login`
Login page with email/password authentication.

### 5.5 `/auth-callback`
Reserved landing point for OAuth redirect flows (no providers wired up yet).

### 5.6 `/payment`
Payment and plan activation page.

### 5.7 `/upgrade`
Pricing and plan comparison page.

### 5.8 `/forgot-password`
Requests a password-reset email.

### 5.9 `/reset-password`
Sets a new password from the emailed link (`?email=…&token=…`).

### 5.10 `/verify-email`
Confirms an email address from the emailed link (`?userId=…&token=…`).

### 5.11 `/terms`
Terms of Service.

### 5.12 `/privacy`
POPIA Privacy Policy, including self-service "download my data" and "delete my account" controls.

## 6. Subscription Logic

### Free plan
- 2 free analyses stored in localStorage
- can analyze if free usage is below limit
- free users see locked results and upgrade prompts

### Pro and School plans
- unlimited analyses
- full report access
- plan state is stored in the user object

### Tracking
- the authoritative usage count is stored server-side (billing engine) and exposed via `/api/Billing/usage`
- a per-account, best-effort local hint is kept under `pathly_free_usage_<userId>` (namespaced by user)
- every `pathly_`-prefixed key is purged from localStorage and sessionStorage on logout

## 7. Technical Architecture

### 7.1 Frontend
- Angular 21.2
- TypeScript 5.9
- RxJS
- Standalone component style with `inject()` and signals
- Angular Router for page navigation
- Uses Angular SSR support via `@angular/ssr`

### 7.2 Services
- `AuthService`: handles login, register (with consent), logout, password reset and email confirmation
- `SubscriptionService`: plan state + a per-account local usage hint (server is authoritative)
- `AcademicService`: sends base64 uploads, fetches stored history/reports and the combined analysis
- `PsychometricService`: submits the career-interest assessment and fetches the stored result (`/me`)
- `BillingService`: plans, live usage and checkout
- `AccountService`: POPIA data export and account deletion
- `app-storage.ts`: central storage keys + full cache purge on logout

### 7.3 Models

The AI response model is defined in `src/app/models/ai-response.model.ts` and includes:
- career matches
- APS analysis
- subject-level results
- strengths and weaknesses
- employment outlook
- university recommendations

### 7.4 Backend integration

The API base URL is configured per environment in `src/environments/`:
- `environment.ts` — production default (relative `/api` paths, same-origin/reverse-proxy friendly)
- `environment.development.ts` — local development (`https://localhost:7135`)

The main endpoints called are:
- `/api/Authentication/registration`, `/api/Authentication/login`
- `/api/Authentication/forgot-password`, `/api/Authentication/reset-password`
- `/api/Authentication/confirm-email`, `/api/Authentication/resend-confirmation`
- `/api/AcademicAnalysis/analysis`, `/api/AcademicAnalysis/analysis/premium`
- `/api/AcademicAnalysis/psychometric-analysis` and `/api/AcademicAnalysis/combined-analysis`
- `/api/AcademicAnalysis/history` and `/api/AcademicAnalysis/{id}` (stored, user-scoped reports)
- `/api/Psychometric/assessment` and `/api/Psychometric/assessment/me`
- `/api/Account/data-export` and `DELETE /api/Account` (POPIA)

An HTTP interceptor (`src/app/interceptors/auth.interceptor.ts`) attaches the stored JWT as a
Bearer token to every API request.

## 8. Implementation Details

### AI response parsing
The academic service handles multiple response shapes and strips markdown fences before JSON parsing.

### File upload handling
- image files are compressed client-side using `<canvas>`
- file input supports PDF and image MIME types
- large files are rejected above 1.5 MB

### Payment simulation
- no real payment gateway integration is present in the frontend currently
- the payment page simulates processing and then updates local storage

## 9. Running the Application Locally

### Requirements
- Node.js and npm
- Angular CLI (optional, can use `npm run` scripts)

### Commands
- `npm install`
- `npm start`
- `ng serve`
- `npm run build`
- `npm test`

### Output
- Development server is available at `http://localhost:4200`
- Production build output is written to `dist/`

## 10. Notes and Next Steps

### Addressed in the current codebase
- server-side, per-user persistence of results + history retrieval
- forgot-password and email-verification flows
- POPIA consent at registration, plus data export and account deletion
- upload validation hardening (nonsense/duplicate subjects rejected, per-term canonicalisation)
- psychometric results now feed the dashboard (combined report)
- career-pathway coherence rules in the analysis prompt
- auth rate limiting and IDOR fixes on all user-data endpoints

### Remaining suggested improvements
- integrate a live email provider (SMTP settings are wired; set `Smtp:*` in production)
- integrate a real payment gateway (Paystack wired; set `Paystack:SecretKey`)
- support bulk upload for School plan
- add a dashboard for schools and teachers
- add an optional CAPTCHA on registration in addition to rate limiting

### Documentation export
To create a PDF from this markdown file:
- open `DOCUMENTATION.md` in VS Code, open preview, and print to PDF
- or use `pandoc DOCUMENTATION.md -o PathlyAI-Documentation.pdf`

---

Generated from the current PathlyAI Angular application codebase.

## 11. Feedback Remediation (January 2026)

Each item from the review is mapped below to the change that addresses it.

| # | Feedback | Fix |
|---|----------|-----|
| 1 | Previous user's results visible after logging in as another user on a shared device (major security flaw) | Reports are stored server-side keyed to the account (`AiResponse.ApplicationUserId`), all read endpoints filter by the JWT account id, local caches are namespaced `pathly_result_<userId>` / `pathly_riasec_<userId>`, and `logout()` purges **every** `pathly_` key from localStorage and sessionStorage. Psychometric endpoints no longer accept a user id from the client (IDOR closed). |
| 2 | No persistent storage; results lost on cache clear / not available on another device | New `GET /api/AcademicAnalysis/history` and `GET /api/AcademicAnalysis/{id}` return the account's stored reports; the dashboard loads the latest stored report on open, so it works across devices and after a cache clear. |
| 3 | Weak upload validation (e.g. "napping" treated as a subject; duplicate subjects inflating results) | New `AcademicRecordSanitizer` canonicalises subject names, drops rows that are not recognisable subjects, and merges duplicate subjects within a term. `ExtractionValidator` now rejects unrecognised subjects and canonical duplicates so the model retries. The driver list is capped per term. |
| 4 | Incoherent career path (e.g. UCT robotics + UP mechanical engineering) | `GroqPromptBuilder` (v2.1) adds explicit coherence rules: one plan, one institution, consistent across the roadmap and the recommended career's programme, never contradicting the qualification list. |
| 5 | Psychometric quiz does not influence dashboard results | New `POST /api/AcademicAnalysis/combined-analysis` fuses the account's stored academic record with their stored assessment (Pro). The dashboard shows the interest profile and offers "Generate Combined Report". |
| 6 | Vague assessment conclusions | The assessment now produces a detailed report: per-dimension interpretation, best-fit environments, strengths, watch-outs, a working-style narrative, development areas and career matches with reasons. |
| 7 | No historical data/reporting; new upload drops previous data | Every report is appended to the account's history (nothing is overwritten). The dashboard shows a history list and an APS-progress trend, and surfaces the deterministic next-term projection. |
| 8 | No "forgot password"; no verification against bot accounts | `forgot-password`, `reset-password`, `confirm-email` and `resend-confirmation` endpoints + pages added; registration stores POPIA consent; anonymous auth endpoints are rate-limited; email-confirmation can be enforced via `Auth:RequireConfirmedEmail`. |
| 9 | POPIA / user agreement / privacy policies | Terms and Privacy pages added, consent captured at registration (`TermsAcceptedAtUtc`, `TermsVersion`, opt-in `MarketingConsent`), and self-service data export (`GET /api/Account/data-export`) and erasure (`DELETE /api/Account`). |
| 10 | Unfinished/empty class files | The in-progress refactor removed the empty stubs; the solution builds with 0 warnings and 88 backend tests pass. |

### New configuration keys
- `Smtp:{Host,Port,UserName,Password,FromAddress,FromName,EnableSsl}` — email delivery (falls back to logging when unset)
- `App:{FrontendBaseUrl,TermsVersion}` — links in emails and the accepted legal version
- `Auth:{RequireConfirmedEmail}` — require email confirmation before sign-in (default `false`)