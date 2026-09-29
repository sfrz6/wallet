import { BANK_COLORS, BANK_INITIALS, bankLogo, isBankKey } from "@/lib/banks";

/**
 * Account avatar. Renders the bank's logo when one is bundled (served from
 * /public/banks), otherwise a brand-colored initials badge, and finally the
 * account name's first letter when no bank is selected. Provides a clean
 * fallback in every case.
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
  const logo = bankLogo(key);

  if (logo) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white"
        style={{ width: size, height: size, padding: size * 0.12 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

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
