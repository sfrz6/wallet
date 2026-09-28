import { and, eq } from "drizzle-orm";
import {
  ledgerEntries,
  transactions,
  type Transaction,
  type TransactionType,
} from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { minorToNumeric } from "@/lib/money";

export interface LedgerLine {
  accountId: string;
  /** Signed change to the account's natural balance, in minor units. */
  amountMinor: bigint;
}

export interface PostTransactionInput {
  userId: string;
  type: TransactionType;
  amountMinor: bigint;
  occurredOn: string; // YYYY-MM-DD
  note?: string | null;
  categoryId?: string | null;
  accountId?: string | null;
  counterpartyAccountId?: string | null;
  debtId?: string | null;
  clientRequestId?: string | null;
  lines: LedgerLine[];
}

export interface PostResult {
  transaction: Transaction;
  /** True when an existing transaction with the same idempotency key was reused. */
  reused: boolean;
}

/**
 * Inserts a transaction header and its signed ledger entries. Must be called
 * inside a database transaction so the header and all entries commit atomically.
 * Honors an optional idempotency key to make double-submits safe.
 */
export async function postTransaction(
  tx: DbExecutor,
  input: PostTransactionInput,
): Promise<PostResult> {
  if (input.clientRequestId) {
    const existing = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, input.userId),
          eq(transactions.clientRequestId, input.clientRequestId),
        ),
      )
      .limit(1);
    if (existing[0]) return { transaction: existing[0], reused: true };
  }

  const headerRows = await tx
    .insert(transactions)
    .values({
      userId: input.userId,
      type: input.type,
      amount: minorToNumeric(input.amountMinor),
      categoryId: input.categoryId ?? null,
      accountId: input.accountId ?? null,
      counterpartyAccountId: input.counterpartyAccountId ?? null,
      debtId: input.debtId ?? null,
      note: input.note?.trim() || null,
      occurredOn: input.occurredOn,
      clientRequestId: input.clientRequestId ?? null,
    })
    .returning();
  const header = headerRows[0];
  if (!header) throw new Error("Failed to insert transaction header.");

  if (input.lines.length > 0) {
    await tx.insert(ledgerEntries).values(
      input.lines.map((line) => ({
        userId: input.userId,
        transactionId: header.id,
        accountId: line.accountId,
        amount: minorToNumeric(line.amountMinor),
      })),
    );
  }

  return { transaction: header, reused: false };
}
