import { and, desc, eq, sql } from "drizzle-orm";
import {
  debtRepayments,
  debts,
  type Debt,
  type DebtDirection,
  type DebtRepayment,
  type DebtStatus,
} from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { minorToNumeric, numericToMinor } from "@/lib/money";
import { assertAccount } from "./accounts";
import { notFound, validation } from "./errors";
import { postTransaction, type PostResult } from "./ledger";

function assertPositive(amountMinor: bigint) {
  if (amountMinor <= 0n) throw validation("errors.amount_positive");
}

export interface CreateLoanGivenInput {
  personName: string;
  amountMinor: bigint;
  fromAccountId: string;
  occurredOn: string;
  note?: string | null;
  dueDate?: string | null;
  clientRequestId?: string | null;
}

/** The user lends money to someone. Cash leaves; a receivable is created. */
export async function createLoanGiven(
  db: DbExecutor,
  userId: string,
  input: CreateLoanGivenInput,
): Promise<{ debt: Debt; post: PostResult }> {
  assertPositive(input.amountMinor);
  const personName = input.personName.trim();
  if (!personName) throw validation("errors.person_name_required");
  return db.transaction(async (tx) => {
    await assertAccount(tx, userId, input.fromAccountId, "debit");
    const debtRows = await tx
      .insert(debts)
      .values({
        userId,
        direction: "lent",
        personName,
        principal: minorToNumeric(input.amountMinor),
        status: "open",
        note: input.note?.trim() || null,
        occurredOn: input.occurredOn,
        dueDate: input.dueDate ?? null,
      })
      .returning();
    const debt = debtRows[0];
    if (!debt) throw validation("errors.debt_create_failed");
    const post = await postTransaction(tx, {
      userId,
      type: "loan_disbursement",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      accountId: input.fromAccountId,
      debtId: debt.id,
      clientRequestId: input.clientRequestId,
      lines: [{ accountId: input.fromAccountId, amountMinor: -input.amountMinor }],
    });
    return { debt, post };
  });
}

export interface CreateBorrowInput {
  personName: string;
  amountMinor: bigint;
  toAccountId: string;
  occurredOn: string;
  note?: string | null;
  dueDate?: string | null;
  clientRequestId?: string | null;
}

/** The user borrows money from someone. Cash arrives; a payable is created. */
export async function createBorrow(
  db: DbExecutor,
  userId: string,
  input: CreateBorrowInput,
): Promise<{ debt: Debt; post: PostResult }> {
  assertPositive(input.amountMinor);
  const personName = input.personName.trim();
  if (!personName) throw validation("errors.person_name_required");
  return db.transaction(async (tx) => {
    await assertAccount(tx, userId, input.toAccountId, "debit");
    const debtRows = await tx
      .insert(debts)
      .values({
        userId,
        direction: "borrowed",
        personName,
        principal: minorToNumeric(input.amountMinor),
        status: "open",
        note: input.note?.trim() || null,
        occurredOn: input.occurredOn,
        dueDate: input.dueDate ?? null,
      })
      .returning();
    const debt = debtRows[0];
    if (!debt) throw validation("errors.debt_create_failed");
    const post = await postTransaction(tx, {
      userId,
      type: "borrow",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      accountId: input.toAccountId,
      debtId: debt.id,
      clientRequestId: input.clientRequestId,
      lines: [{ accountId: input.toAccountId, amountMinor: input.amountMinor }],
    });
    return { debt, post };
  });
}

export interface RecordRepaymentInput {
  debtId: string;
  amountMinor: bigint;
  accountId: string; // destination (lent) or source (borrowed) debit account
  occurredOn: string;
  note?: string | null;
  clientRequestId?: string | null;
}

/**
 * Records a partial or full repayment against a debt. For a debt the user lent
 * out, money returns to an account (not income). For money the user borrowed,
 * money leaves an account (not an expense).
 */
export async function recordRepayment(
  db: DbExecutor,
  userId: string,
  input: RecordRepaymentInput,
): Promise<{ repayment: DebtRepayment; post: PostResult; status: DebtStatus }> {
  assertPositive(input.amountMinor);
  return db.transaction(async (tx) => {
    const debt = await loadDebt(tx, userId, input.debtId);
    const remaining = await remainingMinor(tx, userId, debt);
    if (input.amountMinor > remaining) {
      throw validation("errors.repayment_exceeds_remaining");
    }
    await assertAccount(tx, userId, input.accountId, "debit");

    const isLent = debt.direction === "lent";
    const post = await postTransaction(tx, {
      userId,
      type: isLent ? "loan_repayment_received" : "debt_repayment_paid",
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      note: input.note,
      accountId: input.accountId,
      debtId: debt.id,
      clientRequestId: input.clientRequestId,
      lines: [
        {
          accountId: input.accountId,
          amountMinor: isLent ? input.amountMinor : -input.amountMinor,
        },
      ],
    });

    const repRows = await tx
      .insert(debtRepayments)
      .values({
        userId,
        debtId: debt.id,
        transactionId: post.transaction.id,
        amount: minorToNumeric(input.amountMinor),
        occurredOn: input.occurredOn,
      })
      .returning();
    const repayment = repRows[0];
    if (!repayment) throw validation("errors.repayment_failed");

    const status = await recomputeDebtStatus(tx, userId, debt.id);
    return { repayment, post, status };
  });
}

async function loadDebt(db: DbExecutor, userId: string, debtId: string): Promise<Debt> {
  const rows = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .limit(1);
  const debt = rows[0];
  if (!debt) throw notFound("errors.debt_not_found");
  return debt;
}

async function remainingMinor(db: DbExecutor, userId: string, debt: Debt): Promise<bigint> {
  const rows = await db
    .select({ total: sql<string>`coalesce(sum(${debtRepayments.amount}), '0')` })
    .from(debtRepayments)
    .where(and(eq(debtRepayments.userId, userId), eq(debtRepayments.debtId, debt.id)));
  const paid = numericToMinor(rows[0]?.total ?? "0");
  return numericToMinor(debt.principal) - paid;
}

export async function recomputeDebtStatus(
  db: DbExecutor,
  userId: string,
  debtId: string,
): Promise<DebtStatus> {
  const debt = await loadDebt(db, userId, debtId);
  const principal = numericToMinor(debt.principal);
  const remaining = await remainingMinor(db, userId, debt);
  const paid = principal - remaining;
  let status: DebtStatus = "open";
  if (remaining <= 0n) status = "paid";
  else if (paid > 0n) status = "partially_paid";
  await db
    .update(debts)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));
  return status;
}

export interface DebtWithProgress {
  debt: Debt;
  principalMinor: bigint;
  paidMinor: bigint;
  remainingMinor: bigint;
}

export async function listDebts(
  db: DbExecutor,
  userId: string,
  opts: { direction?: DebtDirection; status?: DebtStatus } = {},
): Promise<DebtWithProgress[]> {
  const conditions = [eq(debts.userId, userId)];
  if (opts.direction) conditions.push(eq(debts.direction, opts.direction));
  if (opts.status) conditions.push(eq(debts.status, opts.status));

  const debtRows = await db
    .select()
    .from(debts)
    .where(and(...conditions))
    .orderBy(desc(debts.occurredOn), desc(debts.createdAt));

  const paidRows = await db
    .select({
      debtId: debtRepayments.debtId,
      total: sql<string>`coalesce(sum(${debtRepayments.amount}), '0')`,
    })
    .from(debtRepayments)
    .where(eq(debtRepayments.userId, userId))
    .groupBy(debtRepayments.debtId);
  const paidByDebt = new Map<string, bigint>();
  for (const r of paidRows) paidByDebt.set(r.debtId, numericToMinor(r.total));

  return debtRows.map((debt) => {
    const principalMinor = numericToMinor(debt.principal);
    const paidMinor = paidByDebt.get(debt.id) ?? 0n;
    return {
      debt,
      principalMinor,
      paidMinor,
      remainingMinor: principalMinor - paidMinor,
    };
  });
}

export async function getDebtWithRepayments(
  db: DbExecutor,
  userId: string,
  debtId: string,
): Promise<DebtWithProgress & { repayments: DebtRepayment[] }> {
  const debt = await loadDebt(db, userId, debtId);
  const repayments = await db
    .select()
    .from(debtRepayments)
    .where(and(eq(debtRepayments.userId, userId), eq(debtRepayments.debtId, debtId)))
    .orderBy(desc(debtRepayments.occurredOn), desc(debtRepayments.createdAt));
  const principalMinor = numericToMinor(debt.principal);
  const paidMinor = repayments.reduce((acc, r) => acc + numericToMinor(r.amount), 0n);
  return {
    debt,
    principalMinor,
    paidMinor,
    remainingMinor: principalMinor - paidMinor,
    repayments,
  };
}

/** Deletes a debt and every linked transaction and repayment atomically. */
export async function deleteDebt(db: DbExecutor, userId: string, debtId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await loadDebt(tx, userId, debtId);
    // Cascades remove linked transactions, ledger entries and repayments.
    await tx.delete(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)));
  });
}
