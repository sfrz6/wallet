import { formatMinor } from "@/lib/money";
import type { AppLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

/**
 * Server component that renders a monetary amount with tabular figures.
 * `tone` colors positive/negative values; omit for neutral.
 */
export function AmountText({
  minor,
  locale,
  currency,
  tone,
  showSign,
  className,
}: {
  minor: bigint;
  locale: AppLocale;
  currency: string;
  tone?: "auto" | "positive" | "negative" | "neutral";
  showSign?: boolean;
  className?: string;
}) {
  let toneClass = "";
  if (tone === "positive") toneClass = "text-[color:var(--color-positive)]";
  else if (tone === "negative") toneClass = "text-[color:var(--color-negative)]";
  else if (tone === "auto") {
    toneClass =
      minor > 0n
        ? "text-[color:var(--color-positive)]"
        : minor < 0n
          ? "text-[color:var(--color-negative)]"
          : "";
  }
  return (
    <span className={cn("tabular whitespace-nowrap", toneClass, className)}>
      {formatMinor(minor, locale, { showSign })} {currency}
    </span>
  );
}
