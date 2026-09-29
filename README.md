# محفظتي (Mahfazati)

A production-quality personal finance management platform. Track multiple
accounts (debit and credit), record daily expenses and income, transfer between
accounts, manage credit cards, and keep track of money you have lent or
borrowed. Fully bilingual: Arabic (RTL) and English (LTR).

The design goal is that a user configures accounts and categories once, then
records everyday transactions in just a few taps.

## Features

- Real authentication: sign up, email verification by code, login (username or
  email), logout, secure server-managed sessions.
- First-run onboarding to create accounts and categories; returning users go
  straight to the dashboard.
- Accounts: debit and credit, optional bank, opening balances, derived current
  balances, archive without losing history.
- User-defined categories (expense / income / both), archivable.
- Transactions with correct financial semantics:
  - Expense (debit account or credit card purchase)
  - Income
  - Transfer between own accounts (not spending)
  - Credit card payment (liability settlement, never double-counted as an expense)
  - Money lent / borrowed, with partial and full repayments
- Dashboard: cash, credit outstanding, net worth, monthly spending and income,
  amounts owed to and by the user, recent transactions, spending by category.
- Reports: monthly trend, spending by category, spending by account,
  debit vs credit spending, with date-range filters.
- Arabic and English with full RTL/LTR support; language preference persists.
- Responsive across desktop, tablet, and mobile.

## Technology stack

- Next.js 15 (App Router) + React 19, TypeScript (strict)
- PostgreSQL with Drizzle ORM and SQL migrations
- Zod for server-side validation
- Argon2id password hashing, database-backed sessions with secure cookies
- Recharts for charts
- Tailwind CSS v4 with a small custom design system
- Resend for verification emails (with a documented local dev fallback)
- Vitest (unit + integration via embedded PGlite) and Playwright (E2E)

## Architecture overview

- `src/db` - Drizzle schema, client, and migration runner.
- `src/domain` - the financial domain layer. All balance and reporting logic
  lives here in reusable server-side services, never in UI or routes.
  - `ledger.ts` posts a transaction header plus signed ledger entries atomically.
  - `transactions.ts`, `loans.ts`, `accounts.ts`, `categories.ts`, `reports.ts`.
- `src/lib` - money handling, auth (password, sessions, verification, rate
  limiting), i18n, validation schemas, env parsing.
- `src/app` - App Router routes, grouped into `(auth)`, `(app)`, and onboarding,
  with server actions colocated per feature.
- `src/components` - reusable UI primitives and app components.

### Financial model

- Money is stored as `NUMERIC(18,3)` (OMR has three decimal places) and all
  arithmetic is done in integer minor units (baisa) with `bigint`. There is no
  floating-point money anywhere. See `src/lib/money.ts`.
- A transaction has one or more signed ledger entries. An account's balance is
  its opening balance plus the sum of its ledger entries. For a debit account
  the natural balance is cash on hand; for a credit account it is the
  outstanding amount owed.
- Only expenses count as spending and only income counts as income. Transfers,
  credit card payments, loans, and repayments are movements of money and never
  affect spending or income totals.
- Every operation that touches more than one row runs inside a database
  transaction, so a transfer or repayment can never be half-saved.

## Security overview

- Server-side authorization on every query: all data is scoped to the
  authenticated user (from the session, never from the client), preventing IDOR.
- Argon2id password hashing; passwords are never stored or logged in plain text.
- Sessions are opaque tokens; only a keyed hash is stored in the database and the
  raw token lives only in an HttpOnly, SameSite=Lax, Secure-in-production cookie.
- Verification codes are single-use, expiring, attempt-limited, and stored only
  as a keyed hash. Codes are never returned through any API.
- Rate limiting on login, signup, verification, and resend.
- Zod validation of all external input on the server.
- Parameterized queries via the ORM (no string-built SQL).
- Security headers including a Content-Security-Policy (see `next.config.ts`).
- Generic auth error messages to avoid user enumeration.

## Prerequisites

- Node.js 20 or newer
- A PostgreSQL database (local, or a managed provider such as Neon or Supabase)

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local (see "Environment variables" below)

# 3. Start a PostgreSQL database. For a quick local one with Docker:
docker run --name mahfazati-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mahfazati -p 5432:5432 -d postgres:16

# 4. Apply migrations
npm run db:migrate

# 5. Run the dev server
npm run dev
```

Open http://localhost:3000. With `DEV_EMAIL_FALLBACK=true` and no Resend key,
verification codes are printed to the server console instead of being emailed.

## Environment variables

| Variable             | Required | Description                                                        |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string (use the pooled URL on Neon).         |
| `AUTH_SECRET`        | Yes      | Random secret (>= 16 chars) for hashing sessions and codes.        |
| `APP_URL`            | No       | Public base URL. Defaults to `http://localhost:3000`.              |
| `REQUIRE_EMAIL_VERIFICATION` | No | `false` (default) skips email verification: sign-ups are verified immediately. Set `true` to require it. |
| `RESEND_API_KEY`     | No\*     | Resend API key for sending verification emails.                    |
| `EMAIL_FROM`         | No\*     | From address, e.g. `Mahfazati <no-reply@yourdomain.com>`.          |
| `DEV_EMAIL_FALLBACK` | No       | `true` prints codes to the console in development. Refused in prod. |

\* Only needed when `REQUIRE_EMAIL_VERIFICATION=true`. In V1 (verification off),
no email provider is required. If you enable verification in production you must
configure a real provider; the console fallback is refused when
`NODE_ENV=production`.

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database migrations

```bash
npm run db:generate   # generate SQL migrations from the schema (after schema changes)
npm run db:migrate    # apply migrations to DATABASE_URL
npm run db:studio     # open Drizzle Studio
```

## Testing

```bash
npm run test          # unit + integration (uses embedded PGlite, no DB server needed)
```

The integration suite runs the financial domain against a real Postgres engine
(PGlite) and includes the full acceptance scenario from the specification, plus
authorization (IDOR) and auth/verification tests.

### End-to-end tests

The Playwright journey needs a running app and access to the verification code:

```bash
# Build and start the app with the test code sink enabled (development only)
E2E_CODE_FILE=./e2e-codes.txt DEV_EMAIL_FALLBACK=true npm run build
E2E_CODE_FILE=./e2e-codes.txt DEV_EMAIL_FALLBACK=true npm run start

# In another shell
npx playwright install chromium
E2E_CODE_FILE=./e2e-codes.txt npm run test:e2e
```

`E2E_CODE_FILE` writes verification codes to a local file for the test to read.
It is only honored outside production and is never an HTTP endpoint.

## Build

```bash
npm run check:emdash  # ensure no em dash characters in source
npm run lint
npm run typecheck
npm run test
npm run build
# or all of the above:
npm run verify
```

## Deployment to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository.
3. Provision a managed PostgreSQL database (Neon or Supabase). Use the pooled
   connection string as `DATABASE_URL`.
4. Set environment variables in the Vercel project settings:
   `DATABASE_URL`, `AUTH_SECRET`, `APP_URL` (your production URL),
   `RESEND_API_KEY`, `EMAIL_FROM`. Do not set `DEV_EMAIL_FALLBACK` in production.
5. Run migrations against the production database once:
   `DATABASE_URL=... npm run db:migrate` (locally, or as a deploy step).
6. Deploy. The default build command (`next build`) works without customization.

Sessions and all financial data live in PostgreSQL (durable and
serverless-friendly); nothing critical is stored on local disk or in memory.

## Notes

- The em dash character (U+2014) is intentionally never used in the UI or source;
  `npm run check:emdash` enforces this.
- Bank selection is visual only and never affects calculations. Bank avatars use
  brand-colored initials rather than bundled third-party logos.
- Remaining `npm audit` advisories are in development-only tooling (test runner
  and build tooling), not in the production runtime dependencies.
