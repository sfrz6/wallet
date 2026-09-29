import { and, eq, sql } from "drizzle-orm";
import { accounts, ledgerEntries, type Account, type AccountType } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { minorToNumeric, numericToMinor } from "@/lib/money";
import { forbidden, notFound, validation } from "./errors";

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  bank?: string | null;
  openingBalanceMinor: bigint;
  creditLimitMinor?: bigint | null;
}

export interface UpdateAccountInput {
  name?: string;
  bank?: string | null;
  creditLimitMinor?: bigint | null;
  openingBalanceMinor?: bigint;
  isArchived?: boolean;
}

export interface AccountWithBalance {
  account: Account;
  /** Natural balance in minor units: cash for debit, outstanding for credit. */
  balanceMinor: bigint;
}

/** Loads an account and asserts it belongs to the user (and optional type). */
export async function assertAccount(
  db: DbExecutor,
  userId: string,
  accountId: string,
  expectedType?: AccountType,
): Promise<Account> {
  const rows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  const account = rows[0];
  if (!account) throw notFound("errors.account_not_found");
  if (expectedType && account.type !== expectedType) {
    throw validation("errors.account_wrong_type");
  }
  return account;
}

/**
 * Asserts an account is an asset account (debit or jamiya), i.e. not a credit
 * liability. Used for transfers, which move real money between owned accounts.
 */
export async function assertAssetAccount(
  db: DbExecutor,
  userId: string,
  accountId: string,
): Promise<Account> {
  const account = await assertAccount(db, userId, accountId);
  if (account.type === "credit") throw validation("errors.account_wrong_type");
  return account;
}

export async function createAccount(
  db: DbExecutor,
  userId: string,
  input: CreateAccountInput,
): Promise<Account> {
  const name = input.name.trim();
  if (name.length === 0) throw validation("errors.account_name_required");
  if (input.openingBalanceMinor < 0n) throw validation("errors.opening_balance_negative");

  const rows = await db
    .insert(accounts)
    .values({
      userId,
      name,
      type: input.type,
      bank: input.bank?.trim() || null,
      openingBalance: minorToNumeric(input.openingBalanceMinor),
      creditLimit:
        input.creditLimitMinor != null ? minorToNumeric(input.creditLimitMinor) : null,
    })
    .returning();
  const created = rows[0];
  if (!created) throw validation("errors.account_create_failed");
  return created;
}

export async function listAccounts(
  db: DbExecutor,
  userId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<Account[]> {
  const where = opts.includeArchived
    ? eq(accounts.userId, userId)
    : and(eq(accounts.userId, userId), eq(accounts.isArchived, false));
  return db.select().from(accounts).where(where).orderBy(accounts.createdAt);
}

/**
 * Returns every account for a user together with its derived natural balance.
 * Balance = opening balance + sum(ledger entries for that account).
 */
export async function getAccountsWithBalances(
  db: DbExecutor,
  userId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<AccountWithBalance[]> {
  const accountRows = await listAccounts(db, userId, opts);

  const sums = await db
    .select({
      accountId: ledgerEntries.accountId,
      total: sql<string>`coalesce(sum(${ledgerEntries.amount}), '0')`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.accountId);

  const sumByAccount = new Map<string, bigint>();
  for (const row of sums) {
    sumByAccount.set(row.accountId, numericToMinor(row.total));
  }

  return accountRows.map((account) => {
    const entriesTotal = sumByAccount.get(account.id) ?? 0n;
    const balanceMinor = numericToMinor(account.openingBalance) + entriesTotal;
    return { account, balanceMinor };
  });
}

export async function getAccountWithBalance(
  db: DbExecutor,
  userId: string,
  accountId: string,
): Promise<AccountWithBalance> {
  const account = await assertAccount(db, userId, accountId);
  const sums = await db
    .select({ total: sql<string>`coalesce(sum(${ledgerEntries.amount}), '0')` })
    .from(ledgerEntries)
    .where(and(eq(ledgerEntries.userId, userId), eq(ledgerEntries.accountId, accountId)));
  const total = sums[0]?.total ?? "0";
  return {
    account,
    balanceMinor: numericToMinor(account.openingBalance) + numericToMinor(total),
  };
}

export async function updateAccount(
  db: DbExecutor,
  userId: string,
  accountId: string,
  input: UpdateAccountInput,
): Promise<Account> {
  await assertAccount(db, userId, accountId);
  const patch: Partial<typeof accounts.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length === 0) throw validation("errors.account_name_required");
    patch.name = name;
  }
  if (input.bank !== undefined) patch.bank = input.bank?.trim() || null;
  if (input.creditLimitMinor !== undefined) {
    patch.creditLimit =
      input.creditLimitMinor != null ? minorToNumeric(input.creditLimitMinor) : null;
  }
  if (input.openingBalanceMinor !== undefined) {
    if (input.openingBalanceMinor < 0n) throw validation("errors.opening_balance_negative");
    patch.openingBalance = minorToNumeric(input.openingBalanceMinor);
  }
  if (input.isArchived !== undefined) patch.isArchived = input.isArchived;

  const rows = await db
    .update(accounts)
    .set(patch)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();
  const updated = rows[0];
  if (!updated) throw forbidden("errors.account_not_found");
  return updated;
}

export async function archiveAccount(
  db: DbExecutor,
  userId: string,
  accountId: string,
): Promise<Account> {
  return updateAccount(db, userId, accountId, { isArchived: true });
}
