/**
 * Bank metadata is purely visual and never affects financial calculations.
 * We intentionally do not bundle third-party bank logos (licensing and asset
 * stability concerns). Instead each bank has a stable brand color and localized
 * name, and the UI renders a clean initials badge as the avatar.
 */
export const BANK_KEYS = [
  "bank_muscat",
  "sohar_international",
  "nbo",
  "bank_dhofar",
  "other",
] as const;

export type BankKey = (typeof BANK_KEYS)[number];

export function isBankKey(value: string | null | undefined): value is BankKey {
  return !!value && (BANK_KEYS as readonly string[]).includes(value);
}

export const BANK_COLORS: Record<BankKey, string> = {
  bank_muscat: "#7A1F2B",
  sohar_international: "#0F6B4F",
  nbo: "#1D4E89",
  bank_dhofar: "#B8860B",
  other: "#4B5563",
};

/** Latin initials used for the avatar badge (locale-independent, brand-neutral). */
export const BANK_INITIALS: Record<BankKey, string> = {
  bank_muscat: "BM",
  sohar_international: "SI",
  nbo: "NBO",
  bank_dhofar: "BD",
  other: "•",
};
