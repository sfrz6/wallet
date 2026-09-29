import { and, desc, eq } from "drizzle-orm";
import { goals, type Goal } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { minorToNumeric, numericToMinor } from "@/lib/money";
import { getAccountsWithBalances } from "./accounts";
import { notFound, validation } from "./errors";

export interface CreateGoalInput {
  name: string;
  targetAmountMinor: bigint;
  accountId?: string | null;
}

export interface GoalWithProgress {
  goal: Goal;
  targetMinor: bigint;
  currentMinor: bigint;
  remainingMinor: bigint;
  completed: boolean;
  /** Integer 0-100. */
  progressPct: number;
  accountName: string | null;
}

async function assertGoal(db: DbExecutor, userId: string, goalId: string): Promise<Goal> {
  const rows = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  const goal = rows[0];
  if (!goal) throw notFound("errors.goal_not_found");
  return goal;
}

export async function createGoal(
  db: DbExecutor,
  userId: string,
  input: CreateGoalInput,
): Promise<Goal> {
  const name = input.name.trim();
  if (!name) throw validation("errors.goal_name_required");
  if (input.targetAmountMinor <= 0n) throw validation("errors.amount_positive");
  const rows = await db
    .insert(goals)
    .values({
      userId,
      name,
      targetAmount: minorToNumeric(input.targetAmountMinor),
      accountId: input.accountId ?? null,
    })
    .returning();
  const created = rows[0];
  if (!created) throw validation("errors.goal_create_failed");
  return created;
}

export async function updateGoal(
  db: DbExecutor,
  userId: string,
  goalId: string,
  input: { name?: string; targetAmountMinor?: bigint; accountId?: string | null },
): Promise<Goal> {
  await assertGoal(db, userId, goalId);
  const patch: Partial<typeof goals.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw validation("errors.goal_name_required");
    patch.name = name;
  }
  if (input.targetAmountMinor !== undefined) {
    if (input.targetAmountMinor <= 0n) throw validation("errors.amount_positive");
    patch.targetAmount = minorToNumeric(input.targetAmountMinor);
  }
  if (input.accountId !== undefined) patch.accountId = input.accountId;

  const rows = await db
    .update(goals)
    .set(patch)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning();
  const updated = rows[0];
  if (!updated) throw notFound("errors.goal_not_found");
  return updated;
}

export async function deleteGoal(db: DbExecutor, userId: string, goalId: string): Promise<void> {
  await assertGoal(db, userId, goalId);
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}

export async function listGoalsWithProgress(
  db: DbExecutor,
  userId: string,
): Promise<GoalWithProgress[]> {
  const [goalRows, balances] = await Promise.all([
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)),
    getAccountsWithBalances(db, userId, { includeArchived: true }),
  ]);

  const byAccount = new Map<string, { name: string; minor: bigint }>();
  let totalDebitCash = 0n;
  for (const b of balances) {
    byAccount.set(b.account.id, { name: b.account.name, minor: b.balanceMinor });
    if (b.account.type === "debit") totalDebitCash += b.balanceMinor;
  }

  const currentFor = (goal: Goal): { current: bigint; accountName: string | null } => {
    if (goal.accountId && byAccount.has(goal.accountId)) {
      const acc = byAccount.get(goal.accountId)!;
      return { current: acc.minor < 0n ? 0n : acc.minor, accountName: acc.name };
    }
    return { current: totalDebitCash < 0n ? 0n : totalDebitCash, accountName: null };
  };

  // Latch newly reached goals so completion is permanent (persist completedAt).
  const nowReached = goalRows.filter(
    (g) => !g.completedAt && currentFor(g).current >= numericToMinor(g.targetAmount),
  );
  if (nowReached.length > 0) {
    const now = new Date();
    for (const g of nowReached) {
      await db
        .update(goals)
        .set({ completedAt: now, updatedAt: now })
        .where(and(eq(goals.id, g.id), eq(goals.userId, userId)));
      g.completedAt = now;
    }
  }

  return goalRows.map((goal) => {
    const targetMinor = numericToMinor(goal.targetAmount);
    const { current: currentMinor, accountName } = currentFor(goal);
    const completed = goal.completedAt !== null;
    const remainingMinor = completed || currentMinor >= targetMinor ? 0n : targetMinor - currentMinor;
    const progressPct = completed
      ? 100
      : targetMinor > 0n
        ? Math.min(100, Math.floor(Number((currentMinor * 100n) / targetMinor)))
        : 0;
    return { goal, targetMinor, currentMinor, remainingMinor, completed, progressPct, accountName };
  });
}
