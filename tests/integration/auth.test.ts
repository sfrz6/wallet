import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb } from "../helpers/setup";
import { users } from "@/db/schema";
import { authenticate, registerUser } from "@/lib/auth/service";
import { createVerificationCode, verifyCode } from "@/lib/auth/verification";

const validUser = {
  username: "Mohammed",
  email: "Mohammed@Example.com",
  password: "strongpass123",
  locale: "en" as const,
};

describe("registration", () => {
  it("creates a user with normalized username and email", async () => {
    const db = await makeDb();
    const user = await registerUser(db, validUser);
    expect(user.username).toBe("mohammed");
    expect(user.email).toBe("mohammed@example.com");
    expect(user.usernameDisplay).toBe("Mohammed");
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toContain("strongpass123");
  });

  it("rejects a duplicate username", async () => {
    const db = await makeDb();
    await registerUser(db, validUser);
    await expect(
      registerUser(db, { ...validUser, email: "other@example.com" }),
    ).rejects.toMatchObject({ messageKey: "errors.username_taken" });
  });

  it("rejects a duplicate email", async () => {
    const db = await makeDb();
    await registerUser(db, validUser);
    await expect(
      registerUser(db, { ...validUser, username: "another" }),
    ).rejects.toMatchObject({ messageKey: "errors.email_taken" });
  });
});

describe("authentication", () => {
  it("authenticates with username or email and correct password", async () => {
    const db = await makeDb();
    await registerUser(db, validUser);
    expect(await authenticate(db, "mohammed", "strongpass123")).toBeTruthy();
    expect(await authenticate(db, "Mohammed@Example.com", "strongpass123")).toBeTruthy();
  });

  it("returns null for a wrong password", async () => {
    const db = await makeDb();
    await registerUser(db, validUser);
    expect(await authenticate(db, "mohammed", "wrong")).toBeNull();
  });

  it("returns null for a non-existent user", async () => {
    const db = await makeDb();
    expect(await authenticate(db, "ghost", "whatever")).toBeNull();
  });
});

describe("email verification", () => {
  it("verifies with the correct code and marks the account verified", async () => {
    const db = await makeDb();
    const user = await registerUser(db, validUser);
    const code = await createVerificationCode(db, user.id);
    const result = await verifyCode(db, user.id, code);
    expect(result.ok).toBe(true);
    const rows = await db.select().from(users).where(eq(users.id, user.id));
    expect(rows[0]?.emailVerifiedAt).not.toBeNull();
  });

  it("rejects an incorrect code", async () => {
    const db = await makeDb();
    const user = await registerUser(db, validUser);
    await createVerificationCode(db, user.id);
    const result = await verifyCode(db, user.id, "000000");
    expect(result.ok).toBe(false);
  });

  it("locks after too many attempts", async () => {
    const db = await makeDb();
    const user = await registerUser(db, validUser);
    await createVerificationCode(db, user.id);
    for (let i = 0; i < 5; i++) await verifyCode(db, user.id, "111111");
    const result = await verifyCode(db, user.id, "111111");
    expect(result).toEqual({ ok: false, reason: "too_many" });
  });

  it("does not store the raw code", async () => {
    const db = await makeDb();
    const user = await registerUser(db, validUser);
    const code = await createVerificationCode(db, user.id);
    const { emailVerifications } = await import("@/db/schema");
    const rows = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.userId, user.id));
    expect(rows[0]?.codeHash).toBeTruthy();
    expect(rows[0]?.codeHash).not.toContain(code);
  });
});
