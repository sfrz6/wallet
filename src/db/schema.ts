import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  boolean,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const accountTypeEnum = pgEnum("account_type", ["debit", "credit"]);
export const categoryKindEnum = pgEnum("category_kind", ["expense", "income", "both"]);
export const localeEnum = pgEnum("locale", ["ar", "en"]);

/**
 * Transaction types preserve the true financial meaning of each operation.
 * The UI may present simplified choices, but the backend always records one of
 * these so reporting rules (spending vs. income vs. movement) stay correct.
 */
export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense", // consumption from a debit account or a credit card purchase
  "income", // real income into a debit account
  "transfer", // movement between the user's own accounts
  "credit_card_payment", // paying down a credit card from a debit account
  "loan_disbursement", // money lent to another person
  "borrow", // money borrowed from another person
  "loan_repayment_received", // recovering money previously lent
  "debt_repayment_paid", // repaying money previously borrowed
]);

export const debtDirectionEnum = pgEnum("debt_direction", ["lent", "borrowed"]);
export const debtStatusEnum = pgEnum("debt_status", ["open", "partially_paid", "paid"]);

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // Normalized (lowercased) values used for uniqueness and lookup.
    username: text("username").notNull(),
    usernameDisplay: text("username_display").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    locale: localeEnum("locale").notNull().default("ar"),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_username_unique").on(t.username),
    uniqueIndex("users_email_unique").on(t.email),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // SHA-256 hash of the opaque session token. The raw token lives only in the
    // user's cookie, never in the database.
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/**
 * Email verification codes. The raw code is never stored; only a salted hash.
 */
export const emailVerifications = pgTable(
  "email_verifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_verifications_user_id_idx").on(t.userId)],
);

/**
 * Fixed-window rate limiting buckets. Keyed by action + identifier (IP/user).
 */
export const rateLimits = pgTable("rate_limits", {
  bucket: text("bucket").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

// ---------------------------------------------------------------------------
// Financial structure
// ---------------------------------------------------------------------------

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    bank: text("bank"), // optional, visual only
    // For debit: cash available when tracking began.
    // For credit: outstanding amount already owed when tracking began.
    openingBalance: numeric("opening_balance", { precision: 18, scale: 3 })
      .notNull()
      .default("0.000"),
    // Optional credit limit, kept separate from the outstanding balance.
    creditLimit: numeric("credit_limit", { precision: 18, scale: 3 }),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: categoryKindEnum("kind").notNull().default("expense"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("categories_user_id_idx").on(t.userId)],
);

export const debts = pgTable(
  "debts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    direction: debtDirectionEnum("direction").notNull(),
    personName: text("person_name").notNull(),
    principal: numeric("principal", { precision: 18, scale: 3 }).notNull(),
    status: debtStatusEnum("status").notNull().default("open"),
    note: text("note"),
    occurredOn: date("occurred_on").notNull(),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("debts_user_id_idx").on(t.userId),
    index("debts_user_status_idx").on(t.userId, t.status),
  ],
);

/**
 * The transaction header. A single logical financial operation. Multiple ledger
 * entries can belong to one transaction (e.g. a transfer touches two accounts).
 */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 18, scale: 3 }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "restrict" }),
    counterpartyAccountId: uuid("counterparty_account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),
    debtId: uuid("debt_id").references(() => debts.id, { onDelete: "cascade" }),
    note: text("note"),
    occurredOn: date("occurred_on").notNull(),
    // Optional client-supplied idempotency key to defend against double submit.
    clientRequestId: text("client_request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("transactions_user_date_idx").on(t.userId, t.occurredOn),
    index("transactions_user_type_idx").on(t.userId, t.type),
    index("transactions_account_idx").on(t.accountId),
    index("transactions_category_idx").on(t.categoryId),
    uniqueIndex("transactions_idempotency_unique")
      .on(t.userId, t.clientRequestId)
      .where(sql`${t.clientRequestId} is not null`),
  ],
);

/**
 * Signed ledger entries. `amount` is the signed change to the account's NATURAL
 * balance:
 *   - debit account natural balance  = cash on hand
 *   - credit account natural balance = outstanding amount owed
 * Balance of an account = opening_balance + sum(entry.amount for that account).
 * The domain layer is the single place that decides the correct sign per
 * transaction type.
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 18, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ledger_entries_account_idx").on(t.accountId),
    index("ledger_entries_transaction_idx").on(t.transactionId),
    index("ledger_entries_user_idx").on(t.userId),
  ],
);

/**
 * Repayment history for a debt. Each repayment links to the transaction that
 * moved the money, and reduces the debt's remaining amount.
 */
export const debtRepayments = pgTable(
  "debt_repayments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    debtId: uuid("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 18, scale: 3 }).notNull(),
    occurredOn: date("occurred_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("debt_repayments_debt_idx").on(t.debtId),
    index("debt_repayments_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtRepayment = typeof debtRepayments.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type CategoryKind = (typeof categoryKindEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type DebtDirection = (typeof debtDirectionEnum.enumValues)[number];
export type DebtStatus = (typeof debtStatusEnum.enumValues)[number];
export type Locale = (typeof localeEnum.enumValues)[number];
