import { BANK_COLORS, BANK_INITIALS, isBankKey } from "@/lib/banks";

/**
 * A brand-neutral avatar for an account. Uses the bank's brand color and
 * initials when a bank is selected, otherwise the account name's first letter.
 * No third-party logo assets are used.
 */
export function BankBadge({
  bank,
  fallbackName,
  size = 36,
}: {
  bank: string | null;
  fallbackName: string;
  size?: number;
}) {
  const key = isBankKey(bank) ? bank : null;
  const color = key ? BANK_COLORS[key] : "#4B5563";
  const initials = key ? BANK_INITIALS[key] : fallbackName.trim().charAt(0).toUpperCase() || "•";
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </span>
  );
}
