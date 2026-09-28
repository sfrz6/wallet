export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** True when the identifier looks like an email (contains "@"). */
export function looksLikeEmail(identifier: string): boolean {
  return identifier.includes("@");
}
