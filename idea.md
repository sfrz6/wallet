# Project Name: محفظتي

You are acting as a senior full-stack software engineer, software architect, database engineer, application security engineer, and professional product UI/UX developer.

Your task is to design, build, test, and prepare a complete production-quality personal finance web application called:

# محفظتي

This must be treated as a real software product, not a coding exercise, university CRUD project, proof of concept, wireframe, or visual prototype.

The final result must:

* Run fully on a local development machine
* Have a real database
* Have real authentication
* Have secure user data isolation
* Have complete working financial workflows
* Have responsive Arabic and English interfaces
* Have production-quality UI
* Be properly structured and documented
* Pass linting, type checking, build, and tests
* Be ready to commit and push to GitHub
* Be deployable to Vercel or a similar modern hosting platform
* Use environment variables correctly
* Contain a proper README with local and production deployment instructions

Do not stop after creating the architecture or initial pages.

Continue until the core application is functional end to end.

If you are working inside an existing repository, inspect it first and work with the existing structure where appropriate.

If starting from an empty directory, create a professional repository structure.

Do not repeatedly ask for approval for normal technical decisions. Make sensible professional decisions and continue.

---

# 1. PRODUCT PURPOSE

محفظتي is a personal finance management platform.

The main purpose is to allow a user to create his own financial structure and then quickly record his daily financial activity.

The application must support:

* Multiple personal accounts
* Debit accounts
* Credit accounts / credit cards
* Opening balances
* User-created expense and income categories
* Expenses
* Income
* Transfers between personal accounts
* Savings transfers
* Credit card purchases
* Credit card payments
* Money lent to other people
* Money borrowed from other people
* Partial debt repayments
* Full debt repayments
* Financial analysis and reports

The system must correctly distinguish between actual spending and movements of money.

Correct financial calculations are more important than simply making CRUD screens.

---

# 2. MOST IMPORTANT UX REQUIREMENT

This is one of the most important requirements in the entire application.

The user should configure the application mainly during the beginning.

For example, during the first use the user may create:

* Daily
* Saving
* Salary
* Main Credit Card

The user may also create categories such as:

* Food
* Fuel
* Shopping
* Family

These are examples only.

The application must NOT force these categories.

Every user creates his own categories.

After the user's accounts and categories have been configured, daily use must become extremely simple.

On future logins:

* Do not show onboarding again
* Do not ask the user to configure categories again
* Do not ask the user to configure accounts again
* Take the user directly to the main dashboard
* Allow adding a financial record quickly
* Reuse the user's existing accounts and categories

The ideal returning-user flow is:

Login

↓

Dashboard

↓

Add Transaction

↓

Choose transaction type

↓

Choose existing account

↓

Choose existing category when applicable

↓

Enter amount

↓

Save

A normal expense should be recordable in only a few interactions.

The application should feel fast and natural for daily personal use.

---

# 3. RECOMMENDED TECHNICAL DIRECTION

Use a modern production stack suitable for local development, GitHub, and deployment to Vercel.

Preferred architecture:

## Frontend and server

Use:

* Next.js
* Latest stable App Router architecture
* TypeScript
* Strict TypeScript mode

Use server components and server-side functionality where appropriate.

Do not expose sensitive financial logic only in the browser.

Critical validation and authorization must happen on the server.

## Database

Use PostgreSQL.

For a Vercel-friendly production database, use a provider such as:

* Neon PostgreSQL
* Supabase PostgreSQL
* Another reliable managed PostgreSQL provider

Use a mature ORM such as:

* Drizzle ORM
* Prisma

Choose one and use it consistently.

Use migrations.

Do not rely on manually-created production tables.

## Styling

A utility framework such as Tailwind CSS is acceptable, but the final application must have its own coherent visual system.

Do not simply generate a generic template dashboard.

Use reusable components and consistent design tokens.

## Charts

Use a mature chart library such as Recharts or an equivalent maintained solution.

Charts must work correctly in both English and Arabic layouts.

## Validation

Use schema validation such as Zod for request and form validation.

Validation must exist on the server even if client validation also exists.

## Email

Use a production email provider such as Resend or standard SMTP for:

* Email verification
* Verification codes
* Future password recovery

Email credentials must only exist in environment variables.

---

# 4. APPLICATION BRANDING

Application name:

محفظتي

English transliteration or secondary text may be:

Mahfazati

However, the main visible Arabic brand should remain:

محفظتي

Do not over-brand the interface.

Keep it professional and understated.

---

# 5. DESIGN REQUIREMENTS

The application must look like it was designed and implemented by an experienced professional software team.

It must NOT look like a generic AI-generated dashboard.

Avoid common AI-generated design patterns such as:

* Excessive gradients
* Large colorful blobs
* Random glow effects
* Glassmorphism everywhere
* Excessive rounded cards
* Excessive shadows
* Huge marketing headings inside the logged-in product
* Random decorative illustrations
* Unnecessary animations
* Emoji as application icons
* Unnecessary badges everywhere
* Fake statistics
* Generic generated marketing copy
* Overloaded dashboards
* Large empty spaces without purpose

Use a clean professional fintech-style interface.

Prioritize:

* Clear hierarchy
* Consistent spacing
* Good typography
* High readability
* Simple forms
* Clear numbers
* Professional tables
* Good responsive behavior
* Subtle borders
* Restrained shadows
* Clear transaction status
* Good empty states

Use a standard professional font stack.

For example:

English:

* Inter
* system-ui
* Arial
* sans-serif

Arabic:

* Noto Sans Arabic or another professional readable Arabic font
* system Arabic fonts as fallback

Do not use unusual decorative fonts.

---

# 6. STRICT TEXT STYLE RULE

Never use an em dash character in the application.

Specifically, never use:

U+2014

Do not use it in:

* Buttons
* Labels
* Error messages
* Empty states
* Notifications
* Navigation
* Tooltips
* Modals
* User-facing text
* Arabic interface text
* English interface text

Use normal punctuation or a standard hyphen where necessary.

Add a simple automated check if practical to prevent accidental em dash characters from being added to user-facing source files.

---

# 7. RESPONSIVE DESIGN

The application must be fully usable on:

* Desktop
* Laptop
* Tablet
* Mobile

Do not create a desktop-only finance dashboard.

Daily transaction entry is especially important on mobile.

The Add Transaction workflow should work very well on a phone.

Use responsive dialogs, drawers, or pages appropriately.

---

# 8. INTERNATIONALIZATION

The application must support:

* Arabic
* English

Arabic must use:

dir="rtl"

English must use:

dir="ltr"

Do not implement Arabic by simply translating text while keeping the English layout unchanged.

RTL behavior must apply correctly to:

* Navigation
* Forms
* Tables
* Icons
* Alignment
* Cards
* Dialogs
* Dropdowns
* Charts where applicable

Users should be able to switch language from settings or the interface.

Store the preferred language.

The preference should remain after the user logs out and returns.

All important user-facing strings must come from translation resources.

Avoid hardcoded English text inside components.

---

# 9. AUTHENTICATION FLOW

The application must have real authentication.

## Sign Up

Required fields:

* Username
* Email
* Password
* Confirm password

Username must be unique.

Email must be unique.

Normalize emails correctly.

Usernames should be compared consistently.

## Email verification

After signup:

1. Create the user as unverified
2. Generate a secure verification code
3. Send the code to the user's email
4. Show verification screen
5. User enters code
6. Validate code
7. Mark email/account as verified
8. Allow normal application access

Verification code security:

* Use cryptographically secure randomness
* Short expiration period, such as approximately 10 minutes
* One-time use
* Never store the raw verification code in the database
* Store a secure hash
* Limit invalid attempts
* Limit resend frequency
* Invalidate older codes when appropriate
* Never expose the code through frontend APIs
* Do not write verification codes to production logs

In local development only, a safe developer email fallback may be documented if no email provider is configured.

Never enable such a fallback in production.

## Login

Allow login using:

* Username + password

Optionally also allow:

* Email + password

Do not require the user to remember whether he registered using username or email.

After successful login, create a secure authenticated session.

---

# 10. AUTHENTICATION SECURITY

Prefer a mature maintained authentication solution that supports the selected Next.js architecture.

Do not invent cryptographic algorithms.

If implementing password authentication directly:

Use a battle-tested password hashing library.

Prefer Argon2id where practical.

A properly configured bcrypt implementation is acceptable if required by platform compatibility.

Never store:

* Plain passwords
* Reversible passwords
* Unsalted password hashes

Never store authentication tokens in localStorage.

Prefer server-managed sessions using secure cookies.

Authentication cookies should be:

* HttpOnly
* Secure in production
* SameSite configured appropriately
* Scoped correctly
* Rotated when needed

Protect against:

* Session fixation
* Credential stuffing
* Brute force attacks
* User enumeration
* CSRF
* XSS
* IDOR
* SQL injection
* Broken access control

---

# 11. FIRST LOGIN EXPERIENCE

After successful signup and verification, determine whether the user has completed initial financial setup.

If not, show an onboarding setup experience.

The initial setup should focus only on useful configuration.

Do not create a long marketing wizard.

The user should configure:

1. Accounts
2. Categories

The onboarding should allow creating multiple records before finishing.

Example:

Account 1:
Name: Daily
Type: Debit
Bank: Bank Muscat
Opening Balance: optional

Account 2:
Name: Saving
Type: Debit
Bank: Sohar International
Opening Balance: optional

Account 3:
Name: Credit Card
Type: Credit
Bank: Bank Muscat
Opening Outstanding Balance: optional

Categories can then be created.

Do not force predefined categories.

When the user completes setup, mark onboarding as completed.

On future logins, go directly to the dashboard.

Users can still modify accounts and categories later through the application settings/pages.

---

# 12. CATEGORIES

Categories must be owned by individual users.

Do not create mandatory system categories such as Food, Fuel, or Shopping.

Each user creates his own categories.

Category fields should include at minimum:

* ID
* User ID
* Name
* Type if required by the final data model
* Active / Archived
* Created timestamp
* Updated timestamp

If transaction types require distinguishing income and expense categories, design this cleanly.

For example, a category may optionally be:

* Expense
* Income
* Both

Do not overcomplicate the daily UI.

A category belonging to User A must never appear for User B.

Users should be able to:

* Create category
* Edit category
* Archive category

Avoid destructive deletion when the category already has financial history.

Historical transactions must remain valid.

---

# 13. ACCOUNTS

Every user creates his own accounts.

The account name is completely user-defined.

Examples:

Daily
Saving
Salary
Travel
Main Card

Do not force account names.

Required or useful fields:

* Account ID
* User ID
* Account name
* Account type
* Optional bank
* Opening balance
* Current calculated balance
* Active / Archived
* Created timestamp
* Updated timestamp

Use UUIDs or another suitable non-sequential external identifier.

Do not expose predictable database behavior unnecessarily.

---

# 14. ACCOUNT TYPES

At minimum support:

## Debit

A Debit account represents money owned by the user.

Examples:

* Current account
* Savings account

## Credit

A Credit account represents money borrowed from a credit provider, normally a credit card.

Credit accounts must be treated as liabilities, not normal positive cash accounts.

Do not calculate credit balances using the same financial meaning as debit balances.

---

# 15. OPENING BALANCE

Creating an account must support an optional starting value.

This is important because the user may start using محفظتي after already using the real bank account for years.

For a Debit account:

Opening Balance represents money already available when tracking begins.

Example:

Daily
Opening Balance: 420 OMR

The system begins tracking from 420 OMR.

For Credit:

Support an optional existing outstanding amount if the user already owes money on the card when starting the application.

The UI must make the meaning clear.

Do not confuse:

* Credit limit
* Available credit
* Outstanding credit card balance

If credit limit support is implemented, keep it separate from outstanding balance.

Opening balances should become part of an auditable financial record.

Do not silently modify historical calculations when the account is edited later.

---

# 16. OPTIONAL BANK SELECTION

When creating an account, the user may optionally select the bank.

Examples include:

* Bank Muscat
* Sohar International
* National Bank of Oman
* Bank Dhofar
* Other

The purpose of the bank selection is mainly visual.

Example:

Account:
Daily

Type:
Debit

Bank:
Bank Muscat

The application can display the Bank Muscat logo next to the Daily account.

Bank selection must NOT change financial calculations.

Do not require a bank.

A user may have:

* Cash account
* Wallet
* Non-bank account
* Other account

Bank logo handling:

* Use legitimate local assets where available
* Keep images optimized
* Do not depend on fragile runtime image URLs
* Provide a clean fallback bank icon or initials when no logo exists

Keep bank metadata separate from user financial transactions.

---

# 17. TRANSACTION TYPES

Financial behavior must be designed correctly.

At minimum support the following concepts:

* Expense
* Income
* Transfer
* Credit card purchase
* Credit card payment
* Money lent
* Money borrowed
* Repayment received
* Repayment paid

The UI can simplify these concepts where appropriate, but the backend must preserve their financial meaning.

---

# 18. EXPENSE

Example:

User pays 8 OMR for food using Daily debit account.

The user selects:

Type:
Expense

Account:
Daily

Category:
Food

Amount:
8

Date:
Today

Optional:
Note

Result:

* Daily balance decreases by 8
* Expense analytics increase by 8
* Food spending increases by 8

---

# 19. INCOME

Example:

Salary of 900 OMR is received in Daily.

Result:

* Daily account balance increases by 900
* Income analytics increase by 900

Income should not be confused with:

* Transfers
* Borrowed money
* Debt repayment received
* Opening balance

---

# 20. TRANSFER BETWEEN OWN ACCOUNTS

Example:

Transfer 200 OMR:

Daily -> Saving

Result:

* Daily decreases by 200
* Saving increases by 200

But:

Total personal spending must NOT increase.

Total income must NOT increase.

This is movement of existing money.

The system must treat the two sides as a linked transfer.

Do not create unrelated records that can become inconsistent.

If one side is updated, maintain transaction integrity.

Use a database transaction.

---

# 21. SAVING

Saving is normally represented by transferring money into a savings account.

Example:

Daily -> Saving
100 OMR

This is not an expense.

The user's total cash distribution changed, but no money was consumed.

Reports may show transfers to savings separately if useful.

Do not include savings transfers inside spending totals.

---

# 22. CREDIT CARD PURCHASE

Example:

User buys fuel for 20 OMR using his credit card.

Record:

Type:
Expense

Account:
Credit Card

Category:
Fuel

Amount:
20

Financial meaning:

* User spent 20 OMR
* Fuel expense increases by 20
* Credit card outstanding liability increases by 20

The application must count this as an expense at purchase time.

---

# 23. CREDIT CARD PAYMENT

Later the user pays the credit card from Daily.

Example:

Daily -> Credit Card
20 OMR

Result:

* Daily debit account decreases by 20
* Credit card outstanding amount decreases by 20

This must NOT create another 20 OMR expense.

Otherwise the user's spending would be double-counted.

The actual expense was already recorded when the credit card purchase happened.

Credit card payment is liability settlement, not a new expense.

This rule is critical.

---

# 24. MONEY LENT TO SOMEONE

The application must support when the user gives money to another person and expects it back.

Example:

User lends Ahmed 50 OMR from Daily.

Record:

Person:
Ahmed

Amount:
50 OMR

Source account:
Daily

Result:

* Daily account decreases by 50
* Create a receivable of 50
* Do not treat the 50 as normal consumption expense

The system should show:

Original Amount
50 OMR

Paid Back
0 OMR

Remaining
50 OMR

Status
Open

Possible statuses:

* Open
* Partially Paid
* Paid

---

# 25. LOAN REPAYMENT RECEIVED

Ahmed returns 20 OMR.

User chooses destination account:

Daily

Result:

* Daily increases by 20
* Ahmed's remaining receivable decreases from 50 to 30
* Do not count the 20 as new income

It is recovery of money previously lent.

If Ahmed later returns 30:

Remaining becomes 0.

Status becomes Paid.

Keep repayment history.

Do not replace the original loan record with only the final value.

---

# 26. MONEY BORROWED FROM SOMEONE

Example:

The user borrows 100 OMR from Khalid.

Money enters Daily.

Result:

* Daily increases by 100
* Create payable liability of 100
* Do not count the 100 as normal income

The user must be able to see:

Original Amount
100

Paid
0

Remaining
100

---

# 27. REPAYING BORROWED MONEY

Example:

User pays Khalid 40 OMR from Daily.

Result:

* Daily decreases by 40
* Payable decreases from 100 to 60
* Do not classify the repayment as a normal expense

When fully repaid:

Remaining:
0

Status:
Paid

Keep full repayment history.

---

# 28. FINANCIAL DATA MODEL

Design the internal financial model carefully before implementing calculations.

Do not calculate financial truth only from mutable "current balance" fields.

Financial history should be derived from an auditable ledger or transaction-entry structure.

A robust approach is:

Transaction

plus

Transaction Entries

where a transaction can affect one or more accounts or financial positions.

For example:

Transfer:

Transaction
Daily -> Saving

Entries:

Daily: -100
Saving: +100

Credit card payment:

Daily: -20
Credit Liability: -20 outstanding

Use a clean accounting-inspired structure internally if it improves correctness.

However, do not expose accounting complexity to normal users.

The interface should remain simple.

All monetary changes affecting multiple records must execute atomically inside a database transaction.

Never allow half of a transfer to save successfully.

---

# 29. MONEY PRECISION

Never use JavaScript floating-point numbers as the authoritative representation for money.

Do not use database FLOAT or DOUBLE for currency values.

Use PostgreSQL:

NUMERIC / DECIMAL

with suitable precision.

Use a decimal-safe library or carefully controlled integer minor units where appropriate.

Example values such as:

0.100 OMR
12.550 OMR

must remain exact.

Financial rounding must be deterministic.

---

# 30. TRANSACTION FIELDS

Typical transaction information may include:

* ID
* User ID
* Transaction type
* Account
* Destination account if applicable
* Category if applicable
* Amount
* Transaction date
* Note
* Created timestamp
* Updated timestamp

The exact normalized structure may use separate tables and ledger entries.

Choose the design that preserves data integrity.

---

# 31. QUICK ADD TRANSACTION

This should be one of the most polished areas of the application.

From the dashboard provide a clear:

Add Transaction

action.

Possible transaction options can include:

* Expense
* Income
* Transfer
* Loan / Debt

Credit card purchases can naturally use Expense while selecting a Credit account.

Credit card payment can be represented through a dedicated option or intelligently through transfer/payment UX.

Prioritize user clarity over technical terminology.

Remember previous user accounts and categories.

Do not force users to type the same category or account name repeatedly.

The application should load their existing configuration.

---

# 32. DASHBOARD

The returning user's dashboard should immediately answer useful financial questions.

Do not overload it.

Possible primary information:

* Current combined debit balance
* Current outstanding credit card amount
* Spending this month
* Income this month
* Money owed to the user
* Money the user owes

Show account summaries.

Show recent transactions.

Provide quick access to Add Transaction.

Provide basic spending analysis by category.

Do not include transfers inside expense totals.

Do not include borrowed money inside income totals.

Do not include repayment of a loan received inside income totals.

Do not include credit card payments inside expenses.

All dashboard calculations must follow the financial rules defined in this specification.

---

# 33. ANALYTICS

The application should allow the user to understand his spending.

Support at minimum:

* Spending by category
* Monthly spending
* Income versus expenses
* Spending by account
* Debit versus credit spending
* Recent transaction trends

Allow date filtering where useful.

Example:

This Month
Last Month
Custom Date Range

Charts must use real user data.

Do not display fake placeholder statistics after production setup.

Empty states should simply explain that there is no data yet.

---

# 34. ACCOUNT PAGE

Provide a page where the user can see all accounts.

Each account should show useful information such as:

* User-defined name
* Debit or Credit
* Optional bank logo
* Current balance or outstanding amount
* Status

Clicking an account should show transaction history associated with that account.

Allow:

* Create
* Edit
* Archive

Be careful when editing financial fields.

Changing the account name should not change historical financial calculations.

---

# 35. CATEGORY PAGE

Provide category management.

Allow:

* Add
* Rename
* Archive

Do not hard-delete categories containing historical transactions unless the design explicitly preserves referential integrity.

Historical transaction reports must remain accurate.

---

# 36. DEBTS AND LOANS PAGE

Provide a dedicated clear view for:

Money people owe me

and

Money I owe people

Each entry should show:

* Person name
* Original amount
* Amount repaid
* Remaining amount
* Date
* Optional due date if implemented
* Status
* Repayment history

Allow partial repayment.

Use clear wording.

Do not make the user understand accounting terminology such as receivable and payable unless used only internally.

---

# 37. TRANSACTION HISTORY

Provide searchable and filterable transaction history.

Useful filters:

* Date
* Account
* Category
* Transaction type

The user should be able to open a transaction and see details.

Allow safe editing where appropriate.

If editing a linked transaction such as a transfer, update the whole linked financial operation atomically.

Do not allow editing one side only and corrupting balances.

---

# 38. DELETION AND REVERSAL

Financial applications require careful deletion behavior.

Do not blindly delete financial rows.

For recent user-created transactions, the UI may support Delete or Undo, but backend behavior must preserve consistency.

For linked transactions such as:

* Transfers
* Credit card payments
* Loan repayments

removing or modifying the operation must update all related ledger entries together.

Consider soft deletion or financial reversal records if this produces safer audit behavior.

Whatever approach is selected:

* Document it
* Test it
* Keep balances correct

---

# 39. DATA ISOLATION

This is critical.

Every financial query must be scoped to the authenticated user.

Never trust:

userId

sent from the frontend.

Determine the authenticated user from the server session.

Example unsafe pattern:

GET /api/accounts/123

then:

SELECT * FROM account WHERE id = 123

This is insufficient.

The query must also verify ownership.

Conceptually:

WHERE account.id = requestedId
AND account.userId = authenticatedUserId

Apply the same rule to:

* Categories
* Transactions
* Loans
* Repayments
* Accounts
* Reports
* Settings

Prevent IDOR vulnerabilities.

---

# 40. AUTHORIZATION

Authentication answers:

Who is the user?

Authorization answers:

Is this user allowed to access this resource?

Implement both.

Do not assume authentication automatically means the user can access every record ID.

Server-side authorization is mandatory.

---

# 41. APPLICATION SECURITY STANDARD

Follow widely accepted secure web development practices and the OWASP Top 10.

Security must be implemented as part of architecture, not added as a final cosmetic step.

Protect against at least:

* Broken access control
* IDOR
* Injection
* SQL injection
* XSS
* CSRF
* Authentication attacks
* Session attacks
* Brute force
* Sensitive data exposure
* Security misconfiguration
* Unsafe redirects
* Dependency vulnerabilities

---

# 42. INPUT VALIDATION

Validate all external input on the server.

Examples:

* Username
* Email
* Password
* Account name
* Category name
* Monetary amount
* Date
* Account ID
* Transaction type
* Notes
* Person name
* Repayment values

Never rely only on HTML input restrictions.

Reject:

* Invalid UUIDs
* Negative values where invalid
* Amounts beyond reasonable database ranges
* References to another user's records
* Invalid enum values
* Unsupported states

---

# 43. DATABASE SECURITY

Use parameterized queries through the ORM.

Never build SQL using raw untrusted string concatenation.

Database credentials belong in environment variables.

Do not commit production credentials.

Use least-privilege database access where practical.

Use:

* Foreign keys
* Unique constraints
* Check constraints
* Transactions
* Appropriate indexes

Database integrity should reinforce application logic.

---

# 44. HTTP SECURITY

Configure appropriate production security headers.

Examples:

* Content-Security-Policy where compatible
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Frame protections

Do not weaken security headers merely to remove development warnings.

Document legitimate exceptions.

---

# 45. RATE LIMITING

Apply rate limiting to sensitive endpoints.

At minimum:

* Login
* Signup
* Verification code submission
* Verification code resend
* Password recovery if implemented

Use IP and account-aware strategies where appropriate.

Do not permanently lock legitimate users after a few failed attempts.

Use progressive throttling or temporary limits.

---

# 46. ERROR HANDLING

Create consistent user-safe errors.

Do not expose:

* SQL errors
* Stack traces
* Secret values
* Internal server paths
* Raw database details

Production errors should be logged securely on the server.

User messages should be helpful without revealing sensitive internals.

Avoid username/email enumeration.

Example:

Instead of:

"This username exists but your password was incorrect"

prefer a generic login failure message.

---

# 47. LOGGING

Implement useful server logging.

Never log:

* Passwords
* Verification codes
* Session tokens
* Authentication cookies
* Database connection strings
* Email provider secrets

Financial values may also require careful handling in production logs.

Log technical events rather than dumping complete request bodies.

---

# 48. ENVIRONMENT VARIABLES

Provide:

.env.example

with placeholders only.

Possible environment variables include:

DATABASE_URL

AUTH_SECRET

EMAIL_PROVIDER_API_KEY

EMAIL_FROM

APP_URL

RATE_LIMIT configuration if required

Never commit actual secrets.

Ensure .env files containing secrets are ignored by Git.

Validate required environment variables at application startup.

---

# 49. ACCESSIBILITY

Build accessible forms and controls.

Use:

* Semantic HTML
* Labels
* Keyboard navigation
* Visible focus states
* Appropriate aria attributes
* Sufficient contrast

Do not make critical actions available only through hover.

Ensure Arabic accessibility remains correct.

---

# 50. FORM QUALITY

Forms should have:

* Clear labels
* Useful validation messages
* Disabled loading state
* Prevention of duplicate submission
* Correct number handling
* Correct date handling

Do not clear the entire form when a server validation error occurs.

---

# 51. DATE AND TIME

Store timestamps in a consistent server-friendly format, normally UTC.

Display them according to user locale.

Transactions should support a user-selected financial transaction date separate from database creation time.

Example:

Transaction Date:
27 September

Created At:
28 September

Do not confuse these values.

---

# 52. PROJECT STRUCTURE

Use a professional maintainable project structure.

Separate concerns such as:

* Authentication
* Financial domain logic
* Database
* Validation
* UI components
* Pages/routes
* Internationalization
* Security
* Services
* Tests

Avoid placing all business logic inside React components.

Avoid huge files.

Avoid duplicated financial calculation logic.

Create a central financial/domain service layer.

---

# 53. BUSINESS LOGIC

Financial rules must live in reusable server-side functions/services.

Examples:

createExpense()

createIncome()

createTransfer()

createCreditCardPayment()

createLoanGiven()

recordLoanRepayment()

createBorrowedMoney()

recordDebtRepayment()

These names are illustrative.

The actual architecture may differ.

The important requirement is:

Do not scatter critical balance logic across UI components and API routes.

---

# 54. DATABASE TRANSACTIONS

Any financial operation affecting multiple database records must use an atomic database transaction.

Examples:

Transfer Daily -> Saving

Credit card payment

Loan repayment

Editing linked financial records

Deleting linked financial records

If any step fails, everything must roll back.

Never leave partial financial operations.

---

# 55. CONCURRENCY

Prevent accidental duplicate records caused by:

* Double clicking Save
* Browser retries
* Network retries
* Concurrent requests

Use appropriate transaction isolation, idempotency, unique operation identifiers, or UI/server protections where useful.

Financial correctness matters more than shaving a few milliseconds from request time.

---

# 56. DATABASE INDEXING

Add sensible indexes for common queries.

Likely examples:

* transactions by user/date
* transactions by account/date
* categories by user
* accounts by user
* loans by user/status
* sessions by token
* verification records by user/email

Do not add indexes randomly.

Use actual query patterns.

---

# 57. TESTING

Create meaningful automated tests.

Do not test only component rendering.

Financial rules require tests.

At minimum test:

## Authentication

* Signup
* Duplicate username
* Duplicate email
* Verification code rules
* Login
* Invalid credentials
* Unverified user behavior
* Session protection

## Authorization

Verify User A cannot:

* Read User B's account
* Update User B's account
* Delete User B's account
* Access User B's transactions
* Access User B's categories
* Access User B's loans

## Financial logic

Test examples such as:

Debit opening balance:
500

Expense:
50

Expected:
450

Income:
100

Expected:
550

Transfer:
Daily 500
Saving 100

Transfer 100

Expected:
Daily 400
Saving 200
Total wealth unchanged

Credit:

Credit purchase:
20

Expected expense:
20

Credit payment:
20

Expected new expense:
0

Lending:

Lend:
50

Repayment:
20

Expected remaining:
30

Borrowing:

Borrow:
100

Repay:
40

Expected remaining:
60

Test partial repayment.

Test full repayment.

Test rollback behavior.

Test monetary decimal precision.

---

# 58. END-TO-END TESTING

Use Playwright or another suitable E2E framework.

Test the core real-user journey:

1. Signup
2. Verification
3. Login
4. First setup
5. Create Daily account
6. Create Saving account
7. Create Credit account
8. Create categories
9. Add expense
10. Add income
11. Transfer between accounts
12. Record credit card expense
13. Pay credit card
14. Lend money
15. Receive partial repayment
16. Check dashboard calculations
17. Log out
18. Log back in
19. Confirm onboarding does not appear
20. Confirm accounts/categories remain available
21. Add another transaction quickly

This returning-user behavior is a core acceptance requirement.

---

# 59. CODE QUALITY

Use:

* TypeScript strict mode
* ESLint
* Formatter
* Consistent naming
* Reusable components
* Server-side validation
* Clear domain types

Avoid:

* any unless genuinely unavoidable
* giant components
* duplicated interfaces
* magic numbers
* business logic in JSX
* commented-out abandoned code
* console.log debugging left in production
* unused components
* placeholder TODOs in core functionality

---

# 60. NO FAKE IMPLEMENTATION

Do not create buttons that do nothing.

Do not create placeholder dashboard values such as:

Total Balance: $24,500

unless it is explicitly development seed/demo data.

Production user accounts should show their actual data.

If the user has no transactions, show a clean empty state.

Every visible primary action should work.

---

# 61. DEVELOPMENT DATA

If seed data is created for development:

* Keep it separate from production
* Do not automatically add categories to real users
* Do not automatically create fake accounts for real users
* Do not run development seeds during production deployment

A development/demo account may be useful for testing but must be clearly separated.

---

# 62. LOCAL DEVELOPMENT

The finished repository must run locally with clear documented commands.

The README must explain:

Prerequisites

Installation

Environment configuration

Database setup

Migrations

Development server

Testing

Production build

Example workflow:

npm install

configure .env.local

run migrations

npm run dev

Do not assume undocumented software exists on the developer machine.

---

# 63. PACKAGE SCRIPTS

Provide useful scripts such as:

npm run dev

npm run build

npm run start

npm run lint

npm run typecheck

npm run test

npm run test:e2e

npm run db:migrate

npm run db:generate

Exact names may vary based on the selected stack.

Document them.

---

# 64. PRODUCTION BUILD

Before declaring the project finished:

Run:

* Dependency installation
* Database/schema validation
* Lint
* Type checking
* Unit/integration tests
* Production build

Fix errors.

Do not say "production ready" while the build is failing.

---

# 65. GIT

The repository must be Git-ready.

Include a proper:

.gitignore

Do not commit:

* node_modules
* secrets
* .env files
* local database artifacts
* build output that should not be tracked
* IDE temporary files

Use clear commit-ready structure.

If Git is not initialized, initialize it.

Create meaningful commits if the environment allows.

---

# 66. GITHUB

The finished application must be ready for GitHub.

Before pushing:

* Ensure no secrets exist in tracked files
* Ensure .env.example contains only placeholders
* Ensure README works for another developer
* Ensure production build succeeds

If GitHub authentication and repository access are available:

* Create or use the intended GitHub repository
* Commit the completed project
* Push the final branch

If GitHub credentials are not available:

Do not fake a successful push.

Leave the repository completely ready and provide the exact commands required to push it.

---

# 67. README

Write a professional README.

Include:

# محفظتي

Short description

Main features

Technology stack

Architecture overview

Security overview

Local development instructions

Environment variables

Database migration instructions

Testing instructions

Build instructions

Deployment instructions

GitHub instructions if needed

Do not write marketing-heavy AI-style copy.

Keep the README technical and useful.

---

# 68. VERCEL DEPLOYMENT

Design the application so it can be deployed to Vercel cleanly.

Production deployment should normally involve:

Vercel

*

Managed PostgreSQL such as Neon/Supabase

*

Production email provider

Document:

* How to import the GitHub repository into Vercel
* Required environment variables
* Production APP_URL
* Database URL
* Email provider keys
* Migration procedure
* Build command if custom configuration is needed

Never place production secrets directly in source code.

---

# 69. SERVERLESS CONSIDERATIONS

Because deployment may use Vercel:

* Use serverless-compatible database configuration
* Use proper database connection pooling
* Avoid assumptions about persistent local filesystem storage
* Do not store uploaded or critical runtime data on local server disk
* Do not use in-memory sessions that disappear between serverless requests
* Do not depend on a continuously-running background process for core functionality

Sessions and financial information must use durable storage.

---

# 70. BANK LOGOS AND STATIC ASSETS

Bank logos and application static assets should work in production.

Prefer optimized local static assets or a controlled asset solution.

Do not use random Google image URLs.

Do not hotlink logos from unstable websites.

Provide a clean fallback when a logo is unavailable.

---

# 71. NAVIGATION

A professional logged-in navigation can include:

* Dashboard
* Transactions
* Accounts
* Categories
* Debts
* Reports
* Settings

Use Arabic equivalents in Arabic mode.

Keep navigation simple.

Do not add unnecessary pages.

On mobile, use a suitable compact navigation pattern.

---

# 72. SETTINGS

Settings should at minimum support relevant application preferences such as:

* Language
* User account/profile information
* Logout

Financial configuration such as accounts and categories should remain accessible through appropriate pages.

Do not overload Settings with unfinished options.

---

# 73. SECURITY SETTINGS

Where appropriate provide:

* Change password
* Logout current session
* Logout other sessions if session management supports it

Never expose raw session identifiers.

---

# 74. PASSWORD CHANGE

Password change should require appropriate authentication.

After a password change:

Consider invalidating existing sessions other than the active session, or provide the user with that option.

Apply rate limiting.

Never email the password.

---

# 75. PASSWORD RESET

If implemented in the first production release:

Use a secure one-time reset mechanism.

Do not reveal whether an email exists in the database.

Use:

* Expiring token/code
* One-time use
* Hashed token storage
* Rate limiting

After reset, invalidate old reset tokens.

---

# 76. USER EXPERIENCE FOR ERRORS

Do not show technical text such as:

Prisma error P2002

500 Internal Server Error

ZodError object

SQLSTATE

Instead show useful product language.

Example:

English:
"Unable to save the transaction. Please review the information and try again."

Arabic:
"تعذر حفظ العملية. تحقق من البيانات وحاول مرة أخرى."

Keep technical information in secure server logs.

---

# 77. ARABIC QUALITY

Arabic should be natural and professional.

Do not use poor literal machine-style translation.

Use consistent financial terms.

Examples can include:

Dashboard:
الرئيسية

Accounts:
الحسابات

Transactions:
العمليات

Categories:
التصنيفات

Expenses:
المصروفات

Income:
الدخل

Transfer:
تحويل

Debts:
الديون والسلف

Reports:
التقارير

Settings:
الإعدادات

Add Transaction:
إضافة عملية

Avoid unnecessary formal complexity.

---

# 78. DATA EXPORT AND EXTRA FEATURES

Do not spend time implementing unrelated features before the agreed core workflows are complete.

The priority order is:

1. Authentication
2. Security
3. Accounts
4. Categories
5. Transactions
6. Transfers
7. Credit logic
8. Debts and loans
9. Dashboard
10. Reports
11. Arabic/English polish
12. Testing
13. Deployment readiness

Do not distract the implementation with AI functionality, social features, investment trading, banking integrations, or unrelated features.

This application does not require AI.

---

# 79. ACCEPTANCE SCENARIO

The following scenario must work correctly.

A new user registers.

Username:
mohammed

Email:
[user@example.com](mailto:user@example.com)

The application sends verification code.

User verifies account.

User logs in.

Because this is the first login, initial setup appears.

User creates:

Daily
Debit
Bank Muscat
Opening Balance: 1000 OMR

Saving
Debit
Bank Muscat
Opening Balance: 3000 OMR

Credit Card
Credit
Bank Muscat
Opening Outstanding: 0 OMR

User creates categories:

Food
Fuel
Shopping

User completes setup.

Dashboard appears.

User adds:

Food Expense
5 OMR
Daily

Expected:

Daily:
995

Monthly expenses:
5

Food:
5

User adds:

Fuel Expense
20 OMR
Credit Card

Expected:

Credit outstanding:
20

Monthly expenses:
25

Fuel:
20

Then:

Transfer Daily -> Saving
100 OMR

Expected:

Daily:
895

Saving:
3100

Monthly expenses remains:
25

Then:

Pay Credit Card
20 OMR
from Daily

Expected:

Daily:
875

Credit outstanding:
0

Monthly expenses remains:
25

Then:

Lend Ahmed
50 OMR
from Daily

Expected:

Daily:
825

Ahmed remaining:
50

Monthly expenses remains:
25

Ahmed returns:

20 OMR
to Daily

Expected:

Daily:
845

Ahmed remaining:
30

Monthly income does NOT increase because this is repayment.

User logs out.

The next day the user logs in.

Expected:

* No onboarding
* Dashboard loads immediately
* Daily, Saving, and Credit Card are still available
* Food, Fuel, and Shopping categories are immediately available
* Add Transaction is immediately accessible
* The user can record a new expense without configuring anything again

This scenario is a required end-to-end acceptance test.

---

# 80. DEFINITION OF DONE

Do not consider the project complete until:

* Signup works
* Email verification works
* Login works
* Logout works
* Protected routes work
* First-time onboarding works
* Returning login bypasses onboarding
* Users can create accounts
* Opening balances work
* Debit accounts work
* Credit accounts work
* Optional banks/logos work
* Users create their own categories
* Expense recording works
* Income recording works
* Transfers work correctly
* Savings transfers are not expenses
* Credit card purchases work
* Credit card payments do not double-count expenses
* Lending money works
* Borrowing money works
* Partial repayments work
* Full repayments work
* Dashboard calculations are correct
* Reports are correct
* User data is isolated
* Authorization tests exist
* Arabic works properly in RTL
* English works properly in LTR
* Mobile layout works
* Desktop layout works
* No em dash character appears in user-facing UI
* No production secrets exist in source control
* Database migrations work
* Lint passes
* Type checking passes
* Tests pass
* Production build passes
* README is complete
* Local installation instructions have been verified
* Repository is GitHub-ready
* Deployment procedure for Vercel is documented

---

# 81. FINAL IMPLEMENTATION BEHAVIOR

Work like an experienced software engineer taking ownership of the repository.

Do not only explain what should be built.

Build it.

Inspect the code.

Create the database schema.

Implement migrations.

Implement authentication.

Implement the UI.

Implement server-side business logic.

Implement financial calculations.

Implement authorization.

Implement Arabic and English.

Implement tests.

Run the project.

Fix errors.

Run the production build.

Review the code for security issues.

Review financial calculations.

Review responsive layouts.

Review RTL behavior.

Review the application for accidental em dash characters.

Remove dead code.

Remove fake placeholder content.

Document everything.

If browser automation or a local browser environment is available, manually verify the major flows in addition to automated tests.

At the end, provide a concise engineering handoff containing:

1. What was implemented
2. Technology stack used
3. Important architecture decisions
4. Database design summary
5. Security protections implemented
6. Tests executed and their results
7. Build result
8. How to run locally
9. Environment variables required
10. Git status
11. GitHub repository/push status
12. How to deploy to Vercel
13. Any genuine remaining limitations

Never claim that something was tested, pushed, deployed, or verified unless it actually was.

The expected outcome is a polished, secure, maintainable, production-quality first release of **محفظتي**.
