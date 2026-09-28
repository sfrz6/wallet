import { eq, or } from "drizzle-orm";
import { users, type Locale, type User } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { DomainError } from "@/domain/errors";
import { hashPassword, verifyPassword } from "./password";
import { looksLikeEmail, normalizeEmail, normalizeUsername } from "./normalize";

// A real Argon2id hash computed once and cached, so a login for a non-existent
// user still performs equivalent KDF work. This prevents timing-based user
// enumeration.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("timing-equalization-placeholder");
  }
  return dummyHashPromise;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  locale: Locale;
}

export async function registerUser(db: DbExecutor, input: RegisterInput): Promise<User> {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  const existing = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)));
  for (const row of existing) {
    if (row.username === username) throw new DomainError("conflict", "errors.username_taken");
    if (row.email === email) throw new DomainError("conflict", "errors.email_taken");
  }

  const passwordHash = await hashPassword(input.password);
  const rows = await db
    .insert(users)
    .values({
      username,
      usernameDisplay: input.username.trim(),
      email,
      passwordHash,
      locale: input.locale,
    })
    .returning();
  const user = rows[0];
  if (!user) throw new DomainError("conflict", "errors.signup_failed");
  return user;
}

/**
 * Authenticates by username or email + password. Returns the user on success or
 * null on any failure, without revealing which part was wrong (no enumeration).
 */
export async function authenticate(
  db: DbExecutor,
  identifierRaw: string,
  password: string,
): Promise<User | null> {
  const identifier = identifierRaw.trim().toLowerCase();
  const condition = looksLikeEmail(identifier)
    ? eq(users.email, identifier)
    : or(eq(users.username, identifier), eq(users.email, identifier));

  const rows = await db.select().from(users).where(condition).limit(1);
  const user = rows[0];

  if (!user) {
    // Perform a dummy verification to equalize timing.
    await verifyPassword(await getDummyHash(), password);
    return null;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  return valid ? user : null;
}

export async function changePassword(
  db: DbExecutor,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user) throw new DomainError("not_found", "errors.user_not_found");
  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw new DomainError("validation", "errors.current_password_incorrect");
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
