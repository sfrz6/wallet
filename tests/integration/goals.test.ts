import { describe, it, expect } from "vitest";
import { makeDb, makeUser, OCCURRED_ON } from "../helpers/setup";
import { createAccount } from "@/domain/accounts";
import { createIncome, createTransfer } from "@/domain/transactions";
import { createGoal, listGoalsWithProgress } from "@/domain/goals";
import { parseAmountToMinor as M } from "@/lib/money";

describe("goals", () => {
  it("latches completion once the target is reached and stays completed after the balance drops", async () => {
    const db = await makeDb();
    const userId = await makeUser(db, "goalu");
    const daily = (
      await createAccount(db, userId, { name: "Daily", type: "debit", openingBalanceMinor: M("0") })
    ).id;
    const saving = (
      await createAccount(db, userId, { name: "Saving", type: "debit", openingBalanceMinor: M("0") })
    ).id;

    const goal = await createGoal(db, userId, {
      name: "Buy iPhone 18",
      targetAmountMinor: M("400"),
      accountId: saving,
    });

    // Not reached yet.
    let list = await listGoalsWithProgress(db, userId);
    expect(list[0]?.completed).toBe(false);

    // Fund the saving account to exactly the target.
    await createIncome(db, userId, { accountId: saving, amountMinor: M("400"), occurredOn: OCCURRED_ON });
    list = await listGoalsWithProgress(db, userId);
    expect(list[0]?.completed).toBe(true);
    expect(list[0]?.progressPct).toBe(100);
    expect(list[0]?.remainingMinor).toBe(M("0"));

    // Spend from the saving account: goal must remain completed.
    await createTransfer(db, userId, {
      fromAccountId: saving,
      toAccountId: daily,
      amountMinor: M("150"),
      occurredOn: OCCURRED_ON,
    });
    list = await listGoalsWithProgress(db, userId);
    expect(list[0]?.completed).toBe(true);
    expect(list[0]?.progressPct).toBe(100);
    // completedAt is persisted.
    expect(list[0]?.goal.completedAt).not.toBeNull();
    void goal;
  });

  it("stays in progress when the target is not reached", async () => {
    const db = await makeDb();
    const userId = await makeUser(db, "goalv");
    const daily = (
      await createAccount(db, userId, { name: "Daily", type: "debit", openingBalanceMinor: M("250") })
    ).id;
    await createGoal(db, userId, { name: "Laptop", targetAmountMinor: M("1000"), accountId: daily });
    const list = await listGoalsWithProgress(db, userId);
    expect(list[0]?.completed).toBe(false);
    expect(list[0]?.progressPct).toBe(25);
    expect(list[0]?.remainingMinor).toBe(M("750"));
  });
});
