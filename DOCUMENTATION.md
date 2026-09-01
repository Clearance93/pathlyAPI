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
- register with email and password
- sign in with email/password
- maintain session data (JWT) in localStorage
- access the upload/analyze page only when authenticated

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
- usage count is persisted in localStorage under `pathly_free_usage`
- IP addresses are optionally recorded in localStorage under `pathly_used_ips`

## 7. Technical Architecture

### 7.1 Frontend
- Angular 21.2
- TypeScript 5.9
- RxJS
- Standalone component style with `inject()` and signals
- Angular Router for page navigation
- Uses Angular SSR support via `@angular/ssr`

### 7.2 Services
- `AuthService`: handles login, register, social redirect storage, logout
- `SubscriptionService`: handles plan state, usage limits, localStorage tracking
- `AcademicService`: sends base64 uploads to AI backend and parses the AI response

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
- `/api/Authentication/registration` and `/api/Authentication/login`
- `/api/AcademicAnalysis/analysis`, `/api/AcademicAnalysis/analysis/premium` and `/api/AcademicAnalysis/psychometric-analysis`
- `/api/Psychometric/assessment`

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

### Suggested improvements
- integrate a real payment gateway (Stripe, PayFast, etc.)
- implement authenticated backend session validation
- support bulk upload for School plan
- add a dashboard for schools and teachers
- add server-side validation for file uploads and plan state
- improve error handling for network/API failures

### Documentation export
To create a PDF from this markdown file:
- open `DOCUMENTATION.md` in VS Code, open preview, and print to PDF
- or use `pandoc DOCUMENTATION.md -o PathlyAI-Documentation.pdf`

---

Generated from the current PathlyAI Angular application codebase.