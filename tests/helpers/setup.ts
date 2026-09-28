import { createTestDb, type TestDb } from "@/db/test-db";
import { users } from "@/db/schema";

export async function makeDb(): Promise<TestDb> {
  const { db } = await createTestDb();
  return db;
}

let counter = 0;

/** Inserts a verified user directly (bypassing the auth flow) for domain tests. */
export async function makeUser(db: TestDb, prefix = "user"): Promise<string> {
  counter += 1;
  const rows = await db
    .insert(users)
    .values({
      username: `${prefix}${counter}`,
      usernameDisplay: `${prefix}${counter}`,
      email: `${prefix}${counter}@example.com`,
      passwordHash: "x",
      emailVerifiedAt: new Date(),
    })
    .returning();
  const user = rows[0];
  if (!user) throw new Error("failed to create test user");
  return user.id;
}

export const MONTH_RANGE = { from: "2026-09-01", to: "2026-09-30" };
export const OCCURRED_ON = "2026-09-15";
