import { describe, it, expect, beforeEach } from "vitest";
import type { TestDb } from "@/db/test-db";
import { makeDb, makeUser, OCCURRED_ON } from "../helpers/setup";
import {
  createAccount,
  getAccountWithBalance,
  listAccounts,
  updateAccount,
} from "@/domain/accounts";
import { assertCategory, createCategory, listCategories } from "@/domain/categories";
import { createExpense, deleteTransaction, getTransaction, listTransactions } from "@/domain/transactions";
import { createLoanGiven, getDebtWithRepayments, listDebts } from "@/domain/loans";
import { DomainError } from "@/domain/errors";
import { parseAmountToMinor as M } from "@/lib/money";

describe("data isolation between users (IDOR protection)", () => {
  let db: TestDb;
  let userA: string;
  let userB: string;
  let aAccount: string;
  let aCategory: string;
  let aTxn: string;
  let aDebt: string;

  beforeEach(async () => {
    db = await makeDb();
    userA = await makeUser(db, "alice");
    userB = await makeUser(db, "bob");

    aAccount = (
      await createAccount(db, userA, { name: "A Daily", type: "debit", openingBalanceMinor: M("500") })
    ).id;
    aCategory = (await createCategory(db, userA, { name: "A Food", kind: "expense" })).id;
    const exp = await createExpense(db, userA, {
      accountId: aAccount,
      categoryId: aCategory,
      amountMinor: M("10"),
      occurredOn: OCCURRED_ON,
    });
    aTxn = exp.transaction.id;
    const loan = await createLoanGiven(db, userA, {
      personName: "Carol",
      fromAccountId: aAccount,
      amountMinor: M("20"),
      occurredOn: OCCURRED_ON,
    });
    aDebt = loan.debt.id;
  });

  it("user B cannot read user A's account", async () => {
    await expect(getAccountWithBalance(db, userB, aAccount)).rejects.toBeInstanceOf(DomainError);
  });

  it("user B cannot update user A's account", async () => {
    await expect(
      updateAccount(db, userB, aAccount, { name: "hacked" }),
    ).rejects.toBeInstanceOf(DomainError);
    // Confirm the name did not change for the real owner.
    const still = await getAccountWithBalance(db, userA, aAccount);
    expect(still.account.name).toBe("A Daily");
  });

  it("user B cannot read user A's category", async () => {
    await expect(assertCategory(db, userB, aCategory)).rejects.toBeInstanceOf(DomainError);
  });

  it("user B cannot read user A's transaction", async () => {
    await expect(getTransaction(db, userB, aTxn)).rejects.toBeInstanceOf(DomainError);
  });

  it("user B cannot delete user A's transaction", async () => {
    await expect(deleteTransaction(db, userB, aTxn)).rejects.toBeInstanceOf(DomainError);
    // Still present for the owner.
    await expect(getTransaction(db, userA, aTxn)).resolves.toBeTruthy();
  });

  it("user B cannot read user A's debt", async () => {
    await expect(getDebtWithRepayments(db, userB, aDebt)).rejects.toBeInstanceOf(DomainError);
  });

  it("user B cannot create a transaction against user A's account", async () => {
    await expect(
      createExpense(db, userB, {
        accountId: aAccount,
        categoryId: aCategory,
        amountMinor: M("5"),
        occurredOn: OCCURRED_ON,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("listing functions never leak another user's rows", async () => {
    expect(await listAccounts(db, userB)).toHaveLength(0);
    expect(await listCategories(db, userB)).toHaveLength(0);
    expect(await listTransactions(db, userB)).toHaveLength(0);
    expect(await listDebts(db, userB)).toHaveLength(0);
    // Owner still sees their data.
    expect((await listAccounts(db, userA)).length).toBeGreaterThan(0);
  });
});
