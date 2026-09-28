import { and, desc, eq, isNull } from "drizzle-orm";
import { emailVerifications, users } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { generateNumericCode, keyedHash, safeEqualHex } from "@/lib/crypto";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function hashCode(userId: string, code: string): string {
  return keyedHash(`${userId}:${code}`);
}

/**
 * Creates a fresh verification code for a user, invalidating any previous
 * unconsumed codes. Returns the raw code, which is only ever emailed, never
 * stored or returned through an API to the client.
 */
export async function createVerificationCode(db: DbExecutor, userId: string): Promise<string> {
  // Invalidate prior outstanding codes.
  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(and(eq(emailVerifications.userId, userId), isNull(emailVerifications.consumedAt)));

  const code = generateNumericCode(6);
  await db.insert(emailVerifications).values({
    userId,
    codeHash: hashCode(userId, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many" | "invalid" };

export async function verifyCode(
  db: DbExecutor,
  userId: string,
  code: string,
): Promise<VerifyResult> {
  const rows = await db
    .select()
    .from(emailVerifications)
    .where(and(eq(emailVerifications.userId, userId), isNull(emailVerifications.consumedAt)))
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);
  const record = rows[0];
  if (!record) return { ok: false, reason: "no_code" };

  if (record.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many" };
  }

  await db
    .update(emailVerifications)
    .set({ attempts: record.attempts + 1 })
    .where(eq(emailVerifications.id, record.id));

  const candidate = hashCode(userId, code);
  if (!safeEqualHex(candidate, record.codeHash)) {
    return { ok: false, reason: "invalid" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(emailVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(emailVerifications.id, record.id));
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  });

  return { ok: true };
}
