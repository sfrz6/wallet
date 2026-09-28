import { eq } from "drizzle-orm";
import { rateLimits } from "@/db/schema";
import type { DbExecutor } from "@/db/types";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiter backed by the database (durable across serverless
 * invocations). `bucket` should encode the action and identifier, e.g.
 * "login:ip:1.2.3.4" or "verify:user:<id>".
 */
export async function hitRateLimit(
  db: DbExecutor,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.bucket, bucket))
    .limit(1);
  const row = existing[0];

  if (!row || row.resetAt.getTime() <= now.getTime()) {
    await db
      .insert(rateLimits)
      .values({ bucket, count: 1, resetAt: windowEnd })
      .onConflictDoUpdate({
        target: rateLimits.bucket,
        set: { count: 1, resetAt: windowEnd },
      });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (row.count >= limit) {
    const retry = Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retry, 1) };
  }

  await db
    .update(rateLimits)
    .set({ count: row.count + 1 })
    .where(eq(rateLimits.bucket, bucket));
  return { allowed: true, retryAfterSeconds: 0 };
}
