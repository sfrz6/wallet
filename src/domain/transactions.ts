import { and, desc, eq, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  accounts,
  categories,
  debtRepayments,
  ledgerEntries,
  transactions,
  type Transaction,
  type TransactionType,
} from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { assertAccount, assertAssetAccount } from "./accounts";
import { assertCategory } from "./categories";
import { invalidState, notFound, validation } from "./errors";
import { postTransaction, type PostResult } from "./ledger";
import { recomputeDebtStatus } from "./loans";

// Transaction types that are safe to delete directly from the transaction list.
const SIMPLE_DELETABLE: TransactionType[] = [
  "expense",
  "income",
  "transfer",
  "credit_card_payment",
];
const REPAYMENT_TYPES: TransactionType[] = ["loan_repayment_received", "debt_repayment_paid"];

interface BaseInput {
  amountMinor: bigint;
  occurredOn: string;
  note?: string | null;
  clientRequestId?: string | null;
}

function assertPositive(amountMinor: bigint) {
  if (amountMinor <= 0n) throw validation("errors.amount_positive");
}

export interface CreateExpenseInput extends BaseInput {
  accountId: string;
  categoryId: string;
}

/**
 * Records consumption. Works for a debit account (cash decreases) or a credit
 * card (outstanding increases). Either way it counts as spending.
 */
export async function createExpense(
  db: DbExecutor,
  userId: string,
  input: CreateExpenseInput,
): Promise<PostResult> {
  assertPositive(input.amountMinor);
  return db.transaction(async (tx) => {
    const account = await assertAccount(tx, userId, input.accountId);
    await assertCategory(tx, userId, input.categoryId);
    // debit: cash goes down (-); credit card: outstanding goes up (+).
    const lineAmount = account.type === "debit" ? -input.amountMinor : input.amountMinor;
    return postTransaction(tx, {
      userId,
      type: "expense",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      categoryId: input.categoryId,
      accountId: input.accountId,
      clientRequestId: input.clientRequestId,
      lines: [{ accountId: input.accountId, amountMinor: lineAmount }],
    });
  });
}

export interface CreateIncomeInput extends BaseInput {
  accountId: string;
  categoryId?: string | null;
}

/** Records real income into a debit account. */
export async function createIncome(
  db: DbExecutor,
  userId: string,
  input: CreateIncomeInput,
): Promise<PostResult> {
  assertPositive(input.amountMinor);
  return db.transaction(async (tx) => {
    await assertAccount(tx, userId, input.accountId, "debit");
    if (input.categoryId) await assertCategory(tx, userId, input.categoryId);
    return postTransaction(tx, {
      userId,
      type: "income",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      categoryId: input.categoryId ?? null,
      accountId: input.accountId,
      clientRequestId: input.clientRequestId,
      lines: [{ accountId: input.accountId, amountMinor: input.amountMinor }],
    });
  });
}

export interface CreateTransferInput extends BaseInput {
  fromAccountId: string;
  toAccountId: string;
}

/**
 * Moves money between two of the user's own asset accounts (debit or jamiya).
 * This covers depositing into a committee (debit -> jamiya) and withdrawing from
 * it (jamiya -> debit). Not spending.
 */
export async function createTransfer(
  db: DbExecutor,
  userId: string,
  input: CreateTransferInput,
): Promise<PostResult> {
  assertPositive(input.amountMinor);
  if (input.fromAccountId === input.toAccountId) throw validation("errors.transfer_same_account");
  return db.transaction(async (tx) => {
    await assertAssetAccount(tx, userId, input.fromAccountId);
    await assertAssetAccount(tx, userId, input.toAccountId);
    return postTransaction(tx, {
      userId,
      type: "transfer",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      accountId: input.fromAccountId,
      counterpartyAccountId: input.toAccountId,
      clientRequestId: input.clientRequestId,
      lines: [
        { accountId: input.fromAccountId, amountMinor: -input.amountMinor },
        { accountId: input.toAccountId, amountMinor: input.amountMinor },
      ],
    });
  });
}

export interface CreateCreditCardPaymentInput extends BaseInput {
  fromAccountId: string; // debit
  creditAccountId: string; // credit
}

/**
 * Pays down a credit card from a debit account. Cash decreases and outstanding
 * decreases. This is liability settlement, NOT a new expense.
 */
export async function createCreditCardPayment(
  db: DbExecutor,
  userId: string,
  input: CreateCreditCardPaymentInput,
): Promise<PostResult> {
  assertPositive(input.amountMinor);
  return db.transaction(async (tx) => {
    await assertAccount(tx, userId, input.fromAccountId, "debit");
    await assertAccount(tx, userId, input.creditAccountId, "credit");
    return postTransaction(tx, {
      userId,
      type: "credit_card_payment",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      accountId: input.fromAccountId,
      counterpartyAccountId: input.creditAccountId,
      clientRequestId: input.clientRequestId,
      lines: [
        { accountId: input.fromAccountId, amountMinor: -input.amountMinor },
        // Reducing outstanding on a credit account is a negative natural delta.
        { accountId: input.creditAccountId, amountMinor: -input.amountMinor },
      ],
    });
  });
}

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

export interface TransactionFilter {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  limit?: number;
  offset?: number;
}

export interface TransactionListItem {
  transaction: Transaction;
  accountName: string | null;
  counterpartyName: string | null;
  categoryName: string | null;
}

export async function listTransactions(
  db: DbExecutor,
  userId: string,
  filter: TransactionFilter = {},
): Promise<TransactionListItem[]> {
  const conditions = [eq(transactions.userId, userId)];
  if (filter.from) conditions.push(gte(transactions.occurredOn, filter.from));
  if (filter.to) conditions.push(lte(transactions.occurredOn, filter.to));
  if (filter.accountId) conditions.push(eq(transactions.accountId, filter.accountId));
  if (filter.categoryId) conditions.push(eq(transactions.categoryId, filter.categoryId));
  if (filter.type) conditions.push(eq(transactions.type, filter.type));

  const acct = alias(accounts, "acct");
  const cp = alias(accounts, "cp");
  const rows = await db
    .select({
      transaction: transactions,
      accountName: acct.name,
      counterpartyName: cp.name,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(acct, eq(acct.id, transactions.accountId))
    .leftJoin(cp, eq(cp.id, transactions.counterpartyAccountId))
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(and(...conditions))
    .orderBy(desc(transactions.occurredOn), desc(transactions.createdAt))
    .limit(filter.limit ?? 50)
    .offset(filter.offset ?? 0);

  return rows.map((r) => ({
    transaction: r.transaction,
    accountName: r.accountName,
    counterpartyName: r.counterpartyName,
    categoryName: r.categoryName,
  }));
}

export async function getTransaction(
  db: DbExecutor,
  userId: string,
  transactionId: string,
): Promise<Transaction> {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .limit(1);
  const t = rows[0];
  if (!t) throw notFound("errors.transaction_not_found");
  return t;
}

/**
 * Deletes a transaction and all of its ledger effects atomically. Loan and
 * borrow creations must be removed from the debts view instead, so their
 * repayment history stays consistent.
 */
export async function deleteTransaction(
  db: DbExecutor,
  userId: string,
  transactionId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const t = await getTransaction(tx, userId, transactionId);

    if (t.type === "loan_disbursement" || t.type === "borrow") {
      throw invalidState("errors.delete_loan_from_debts");
    }

    if (REPAYMENT_TYPES.includes(t.type)) {
      // Remove the linked repayment record, then recompute the debt status.
      const rep = await tx
        .select()
        .from(debtRepayments)
        .where(
          and(
            eq(debtRepayments.transactionId, transactionId),
            eq(debtRepayments.userId, userId),
          ),
        )
        .limit(1);
      await tx
        .delete(ledgerEntries)
        .where(and(eq(ledgerEntries.transactionId, transactionId), eq(ledgerEntries.userId, userId)));
      await tx
        .delete(debtRepayments)
        .where(and(eq(debtRepayments.transactionId, transactionId), eq(debtRepayments.userId, userId)));
      await tx
        .delete(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
      const debtId = rep[0]?.debtId;
      if (debtId) await recomputeDebtStatus(tx, userId, debtId);
      return;
    }

    if (!SIMPLE_DELETABLE.includes(t.type)) {
      throw invalidState("errors.transaction_not_deletable");
    }
    await tx
      .delete(ledgerEntries)
      .where(and(eq(ledgerEntries.transactionId, transactionId), eq(ledgerEntries.userId, userId)));
    await tx
      .delete(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
  });
}
