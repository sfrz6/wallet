import { and, eq, gte, lte, sql } from "drizzle-orm";
import { accounts, categories, transactions } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { numericToMinor } from "@/lib/money";
import { getAccountsWithBalances } from "./accounts";
import { listDebts } from "./loans";
import { listTransactions, type TransactionListItem } from "./transactions";

export interface DateRange {
  from: string; // YYYY-MM-DD inclusive
  to: string; // YYYY-MM-DD inclusive
}

/** Sum of expense transaction amounts in a range. Only real spending counts. */
export async function totalSpending(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<bigint> {
  const rows = await db
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), '0')` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    );
  return numericToMinor(rows[0]?.total ?? "0");
}

/** Sum of income transaction amounts in a range. Excludes transfers/borrow/repayment. */
export async function totalIncome(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<bigint> {
  const rows = await db
    .select({ total: sql<string>`coalesce(sum(${transactions.amount}), '0')` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "income"),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    );
  return numericToMinor(rows[0]?.total ?? "0");
}

export interface CategorySpending {
  categoryId: string | null;
  categoryName: string | null;
  amountMinor: bigint;
}

export async function spendingByCategory(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<CategorySpending[]> {
  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sql<string>`coalesce(sum(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .leftJoin(categories, eq(categories.id, transactions.categoryId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    )
    .groupBy(transactions.categoryId, categories.name);

  return rows
    .map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      amountMinor: numericToMinor(r.total),
    }))
    .sort((a, b) => (b.amountMinor > a.amountMinor ? 1 : b.amountMinor < a.amountMinor ? -1 : 0));
}

export interface AccountSpending {
  accountId: string;
  accountName: string;
  amountMinor: bigint;
}

export async function spendingByAccount(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<AccountSpending[]> {
  const rows = await db
    .select({
      accountId: transactions.accountId,
      accountName: accounts.name,
      total: sql<string>`coalesce(sum(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    )
    .groupBy(transactions.accountId, accounts.name);

  return rows.map((r) => ({
    accountId: r.accountId ?? "",
    accountName: r.accountName,
    amountMinor: numericToMinor(r.total),
  }));
}

export interface DebitCreditSpending {
  debitMinor: bigint;
  creditMinor: bigint;
}

export async function debitVsCreditSpending(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<DebitCreditSpending> {
  const rows = await db
    .select({
      type: accounts.type,
      total: sql<string>`coalesce(sum(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(accounts.id, transactions.accountId))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    )
    .groupBy(accounts.type);

  let debitMinor = 0n;
  let creditMinor = 0n;
  for (const r of rows) {
    if (r.type === "debit") debitMinor = numericToMinor(r.total);
    else creditMinor = numericToMinor(r.total);
  }
  return { debitMinor, creditMinor };
}

export interface MonthlyPoint {
  month: string; // YYYY-MM
  spendingMinor: bigint;
  incomeMinor: bigint;
}

export async function monthlySeries(
  db: DbExecutor,
  userId: string,
  range: DateRange,
): Promise<MonthlyPoint[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${transactions.occurredOn}, 'YYYY-MM')`,
      type: transactions.type,
      total: sql<string>`coalesce(sum(${transactions.amount}), '0')`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredOn, range.from),
        lte(transactions.occurredOn, range.to),
      ),
    )
    .groupBy(sql`to_char(${transactions.occurredOn}, 'YYYY-MM')`, transactions.type);

  const byMonth = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    const point = byMonth.get(r.month) ?? { month: r.month, spendingMinor: 0n, incomeMinor: 0n };
    if (r.type === "expense") point.spendingMinor = numericToMinor(r.total);
    else if (r.type === "income") point.incomeMinor = numericToMinor(r.total);
    byMonth.set(r.month, point);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface DashboardSummary {
  totalDebitCashMinor: bigint;
  totalCreditOutstandingMinor: bigint;
  netWorthMinor: bigint;
  spendingThisMonthMinor: bigint;
  incomeThisMonthMinor: bigint;
  owedToUserMinor: bigint; // people owe the user (lent, remaining)
  userOwesMinor: bigint; // the user owes people (borrowed, remaining)
  spendingByCategory: CategorySpending[];
  recentTransactions: TransactionListItem[];
}

export async function getDashboardSummary(
  db: DbExecutor,
  userId: string,
  monthRange: DateRange,
): Promise<DashboardSummary> {
  const [balances, spending, income, categorySpending, recent, lent, borrowed] = await Promise.all([
    getAccountsWithBalances(db, userId),
    totalSpending(db, userId, monthRange),
    totalIncome(db, userId, monthRange),
    spendingByCategory(db, userId, monthRange),
    listTransactions(db, userId, { limit: 8 }),
    listDebts(db, userId, { direction: "lent" }),
    listDebts(db, userId, { direction: "borrowed" }),
  ]);

  let totalDebitCashMinor = 0n;
  let totalCreditOutstandingMinor = 0n;
  for (const b of balances) {
    if (b.account.type === "debit") totalDebitCashMinor += b.balanceMinor;
    else totalCreditOutstandingMinor += b.balanceMinor;
  }

  const owedToUserMinor = lent.reduce(
    (acc, d) => acc + (d.remainingMinor > 0n ? d.remainingMinor : 0n),
    0n,
  );
  const userOwesMinor = borrowed.reduce(
    (acc, d) => acc + (d.remainingMinor > 0n ? d.remainingMinor : 0n),
    0n,
  );

  return {
    totalDebitCashMinor,
    totalCreditOutstandingMinor,
    netWorthMinor: totalDebitCashMinor - totalCreditOutstandingMinor,
    spendingThisMonthMinor: spending,
    incomeThisMonthMinor: income,
    owedToUserMinor,
    userOwesMinor,
    spendingByCategory: categorySpending,
    recentTransactions: recent,
  };
}
