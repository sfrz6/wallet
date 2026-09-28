import { and, eq, lt, ne } from "drizzle-orm";
import { sessions, users, type User } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { keyedHash, randomToken } from "@/lib/crypto";

export const SESSION_COOKIE = "mahfazati_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // refresh when < 15 days left

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

/** Creates a new session and returns the raw token (stored only in the cookie). */
export async function createSession(db: DbExecutor, userId: string): Promise<CreatedSession> {
  const token = randomToken(32);
  const tokenHash = keyedHash(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ userId, tokenHash, expiresAt });
  return { token, expiresAt };
}

export interface ValidatedSession {
  user: User;
  expiresAt: Date;
}

/**
 * Validates a raw session token: looks up its hash, checks expiry, and applies
 * sliding refresh. Returns the user or null. Expired sessions are deleted.
 */
export async function validateSessionToken(
  db: DbExecutor,
  token: string,
): Promise<ValidatedSession | null> {
  const tokenHash = keyedHash(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  const found = rows[0];
  if (!found) return null;

  const now = Date.now();
  if (found.session.expiresAt.getTime() <= now) {
    await db.delete(sessions).where(eq(sessions.id, found.session.id));
    return null;
  }

  let expiresAt = found.session.expiresAt;
  if (found.session.expiresAt.getTime() - now < REFRESH_THRESHOLD_MS) {
    expiresAt = new Date(now + SESSION_TTL_MS);
    await db
      .update(sessions)
      .set({ expiresAt, lastUsedAt: new Date() })
      .where(eq(sessions.id, found.session.id));
  }

  return { user: found.user, expiresAt };
}

export async function invalidateSessionToken(db: DbExecutor, token: string): Promise<void> {
  const tokenHash = keyedHash(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

/** Invalidates all of a user's sessions, optionally keeping the current one. */
export async function invalidateUserSessions(
  db: DbExecutor,
  userId: string,
  keepToken?: string,
): Promise<void> {
  if (keepToken) {
    const keepHash = keyedHash(keepToken);
    await db
      .delete(sessions)
      .where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, keepHash)));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

/** Housekeeping: remove expired sessions. */
export async function purgeExpiredSessions(db: DbExecutor): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
