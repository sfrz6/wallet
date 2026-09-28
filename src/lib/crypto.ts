import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getEnv } from "./env";

/** Generates a URL-safe opaque token with the given number of random bytes. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Generates a cryptographically secure numeric code of the given length. */
export function generateNumericCode(digits = 6): string {
  let code = "";
  for (let i = 0; i < digits; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/**
 * Keyed hash (HMAC-SHA256) using AUTH_SECRET. Used for session tokens and
 * verification codes so that a database leak alone cannot reverse or brute force
 * the stored values without the server secret.
 */
export function keyedHash(value: string): string {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(value).digest("hex");
}

/** Constant-time comparison of two hex strings of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
