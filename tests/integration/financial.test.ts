import { describe, it, expect, beforeEach } from "vitest";
import type { TestDb } from "@/db/test-db";
import { makeDb, makeUser, MONTH_RANGE, OCCURRED_ON } from "../helpers/setup";
import { createAccount, getAccountsWithBalances } from "@/domain/accounts";
import { createCategory } from "@/domain/categories";
import {
  createCreditCardPayment,
  createExpense,
  createIncome,
  createTransfer,
} from "@/domain/transactions";
import { createBorrow, createLoanGiven, listDebts, recordRepayment } from "@/domain/loans";
import { totalIncome, totalSpending, spendingByCategory } from "@/domain/reports";
import { parseAmountToMinor } from "@/lib/money";
import { DomainError } from "@/domain/errors";

const M = parseAmountToMinor;

async function balanceOf(db: TestDb, userId: string, accountId: string): Promise<bigint> {
  const all = await getAccountsWithBalances(db, userId, { includeArchived: true });
  const found = all.find((b) => b.account.id === accountId);
  if (!found) throw new Error("account not found");
  return found.balanceMinor;
}

describe("acceptance scenario (spec section 79)", () => {
  let db: TestDb;
  let userId: string;
  let daily: string;
  let saving: string;
  let card: string;
  let food: string;
  let fuel: string;

  beforeEach(async () => {
    db = await makeDb();
    userId = await makeUser(db, "mohammed");

    daily = (
      await createAccount(db, userId, {
        name: "Daily",
        type: "debit",
        bank: "Bank Muscat",
        openingBalanceMinor: M("1000"),
      })
    ).id;
    saving = (
      await createAccount(db, userId, {
        name: "Saving",
        type: "debit",
        bank: "Bank Muscat",
        openingBalanceMinor: M("3000"),
      })
    ).id;
    card = (
      await createAccount(db, userId, {
        name: "Credit Card",
        type: "credit",
        bank: "Bank Muscat",
        openingBalanceMinor: M("0"),
      })
    ).id;

    food = (await createCategory(db, userId, { name: "Food", kind: "expense" })).id;
    fuel = (await createCategory(db, userId, { name: "Fuel", kind: "expense" })).id;
    await createCategory(db, userId, { name: "Shopping", kind: "expense" });
  });

  it("runs the full journey with correct balances and totals", async () => {
    // Food expense 5 from Daily
    await createExpense(db, userId, {
      accountId: daily,
      categoryId: food,
      amountMinor: M("5"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("995"));
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("5"));

    // Fuel expense 20 on Credit Card
    await createExpense(db, userId, {
      accountId: card,
      categoryId: fuel,
      amountMinor: M("20"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, card)).toBe(M("20")); // outstanding
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("25"));

    const byCat = await spendingByCategory(db, userId, MONTH_RANGE);
    expect(byCat.find((c) => c.categoryId === food)?.amountMinor).toBe(M("5"));
    expect(byCat.find((c) => c.categoryId === fuel)?.amountMinor).toBe(M("20"));

    // Transfer Daily -> Saving 100
    await createTransfer(db, userId, {
      fromAccountId: daily,
      toAccountId: saving,
      amountMinor: M("100"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("895"));
    expect(await balanceOf(db, userId, saving)).toBe(M("3100"));
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("25")); // unchanged

    // Pay credit card 20 from Daily
    await createCreditCardPayment(db, userId, {
      fromAccountId: daily,
      creditAccountId: card,
      amountMinor: M("20"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("875"));
    expect(await balanceOf(db, userId, card)).toBe(M("0")); // outstanding cleared
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("25")); // still 25, no double count

    // Lend Ahmed 50 from Daily
    const loan = await createLoanGiven(db, userId, {
      personName: "Ahmed",
      fromAccountId: daily,
      amountMinor: M("50"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("825"));
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("25")); // lending is not spending

    let lent = await listDebts(db, userId, { direction: "lent" });
    expect(lent[0]?.remainingMinor).toBe(M("50"));
    expect(lent[0]?.debt.status).toBe("open");

    // Ahmed returns 20 to Daily
    await recordRepayment(db, userId, {
      debtId: loan.debt.id,
      accountId: daily,
      amountMinor: M("20"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("845"));
    expect(await totalIncome(db, userId, MONTH_RANGE)).toBe(M("0")); // repayment is not income

    lent = await listDebts(db, userId, { direction: "lent" });
    expect(lent[0]?.remainingMinor).toBe(M("30"));
    expect(lent[0]?.debt.status).toBe("partially_paid");
  });

  it("keeps net worth unchanged across a transfer", async () => {
    const before = await getAccountsWithBalances(db, userId);
    const netBefore = before.reduce(
      (acc, b) => acc + (b.account.type === "debit" ? b.balanceMinor : -b.balanceMinor),
      0n,
    );
    await createTransfer(db, userId, {
      fromAccountId: daily,
      toAccountId: saving,
      amountMinor: M("250"),
      occurredOn: OCCURRED_ON,
    });
    const after = await getAccountsWithBalances(db, userId);
    const netAfter = after.reduce(
      (acc, b) => acc + (b.account.type === "debit" ? b.balanceMinor : -b.balanceMinor),
      0n,
    );
    expect(netAfter).toBe(netBefore);
  });
});

describe("borrowing and repayment", () => {
  it("borrowing adds cash without counting as income; repayment reduces remaining", async () => {
    const db = await makeDb();
    const userId = await makeUser(db, "khalid");
    const daily = (
      await createAccount(db, userId, {
        name: "Daily",
        type: "debit",
        openingBalanceMinor: M("100"),
      })
    ).id;

    const borrow = await createBorrow(db, userId, {
      personName: "Khalid",
      toAccountId: daily,
      amountMinor: M("100"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("200"));
    expect(await totalIncome(db, userId, MONTH_RANGE)).toBe(M("0"));

    await recordRepayment(db, userId, {
      debtId: borrow.debt.id,
      accountId: daily,
      amountMinor: M("40"),
      occurredOn: OCCURRED_ON,
    });
    expect(await balanceOf(db, userId, daily)).toBe(M("160"));
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("0")); // repaying is not spending

    const borrowed = await listDebts(db, userId, { direction: "borrowed" });
    expect(borrowed[0]?.remainingMinor).toBe(M("60"));
    expect(borrowed[0]?.debt.status).toBe("partially_paid");
  });

  it("full repayment sets status to paid", async () => {
    const db = await makeDb();
    const userId = await makeUser(db);
    const daily = (
      await createAccount(db, userId, { name: "Daily", type: "debit", openingBalanceMinor: M("0") })
    ).id;
    const loan = await createLoanGiven(db, userId, {
      personName: "Sara",
      fromAccountId: daily,
      amountMinor: M("30"),
      occurredOn: OCCURRED_ON,
    });
    await recordRepayment(db, userId, {
      debtId: loan.debt.id,
      accountId: daily,
      amountMinor: M("30"),
      occurredOn: OCCURRED_ON,
    });
    const lent = await listDebts(db, userId, { direction: "lent" });
    expect(lent[0]?.remainingMinor).toBe(M("0"));
    expect(lent[0]?.debt.status).toBe("paid");
  });

  it("rejects a repayment larger than the remaining amount", async () => {
    const db = await makeDb();
    const userId = await makeUser(db);
    const daily = (
      await createAccount(db, userId, { name: "Daily", type: "debit", openingBalanceMinor: M("0") })
    ).id;
    const loan = await createLoanGiven(db, userId, {
      personName: "Omar",
      fromAccountId: daily,
      amountMinor: M("10"),
      occurredOn: OCCURRED_ON,
    });
    await expect(
      recordRepayment(db, userId, {
        debtId: loan.debt.id,
        accountId: daily,
        amountMinor: M("50"),
        occurredOn: OCCURRED_ON,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});

describe("decimal precision", () => {
  it("handles three-decimal OMR amounts exactly", async () => {
    const db = await makeDb();
    const userId = await makeUser(db);
    const daily = (
      await createAccount(db, userId, {
        name: "Daily",
        type: "debit",
        openingBalanceMinor: M("100.000"),
      })
    ).id;
    const cat = (await createCategory(db, userId, { name: "Misc", kind: "expense" })).id;
    for (let i = 0; i < 10; i++) {
      await createExpense(db, userId, {
        accountId: daily,
        categoryId: cat,
        amountMinor: M("0.001"),
        occurredOn: OCCURRED_ON,
      });
    }
    expect(await balanceOf(db, userId, daily)).toBe(M("99.990"));
    expect(await totalSpending(db, userId, MONTH_RANGE)).toBe(M("0.010"));
  });
});
