/**
 * Money handling for محفظتي.
 *
 * All monetary arithmetic is done in INTEGER MINOR UNITS (baisa) using bigint,
 * so there is never any floating point involved. The Omani Rial (OMR) has three
 * decimal places, i.e. 1 OMR = 1000 baisa.
 *
 * The database stores amounts as NUMERIC(18,3) strings; this module converts
 * between that canonical string form and internal bigint minor units.
 */

export const CURRENCY_DECIMALS = 3;
export const MINOR_PER_MAJOR = 10n ** BigInt(CURRENCY_DECIMALS); // 1000n

// Guard rail: reject absurd amounts well within NUMERIC(18,3) range.
// 18 total digits, 3 fractional => max 15 integer digits.
export const MAX_MINOR = 10n ** 18n - 1n;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

/**
 * Parse a user-provided amount string (or number) into bigint minor units.
 * Accepts up to CURRENCY_DECIMALS fractional digits. Does not allow a sign here;
 * negativity/positivity rules belong to the validation layer.
 */
export function parseAmountToMinor(input: string | number): bigint {
  const raw = typeof input === "number" ? numberToDecimalString(input) : input.trim();
  if (raw === "") throw new MoneyError("Amount is required.");

  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) throw new MoneyError("Amount must be a positive decimal number.");

  const intPart = match[1] ?? "0";
  const fracPartRaw = match[2] ?? "";
  if (fracPartRaw.length > CURRENCY_DECIMALS) {
    throw new MoneyError(`Amount cannot have more than ${CURRENCY_DECIMALS} decimal places.`);
  }
  const fracPart = fracPartRaw.padEnd(CURRENCY_DECIMALS, "0");
  const minor = BigInt(intPart) * MINOR_PER_MAJOR + BigInt(fracPart || "0");
  if (minor > MAX_MINOR) throw new MoneyError("Amount is too large.");
  return minor;
}

/**
 * Convert a NUMERIC string returned by the database into bigint minor units.
 * Handles an optional leading minus sign (liabilities/ledger entries can be
 * stored as signed decimals).
 */
export function numericToMinor(numeric: string): bigint {
  const trimmed = numeric.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const minor = parseAmountToMinor(unsigned);
  return negative ? -minor : minor;
}

/**
 * Convert bigint minor units to the canonical NUMERIC(18,3) string for storage.
 * Preserves sign.
 */
export function minorToNumeric(minor: bigint): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const major = abs / MINOR_PER_MAJOR;
  const frac = abs % MINOR_PER_MAJOR;
  const fracStr = frac.toString().padStart(CURRENCY_DECIMALS, "0");
  return `${negative ? "-" : ""}${major.toString()}.${fracStr}`;
}

/**
 * Format minor units for display. Groups thousands and always shows the fixed
 * number of decimals. Locale controls the numbering system and grouping.
 */
export function formatMinor(
  minor: bigint,
  locale: "en" | "ar" = "en",
  options?: { showSign?: boolean },
): string {
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const major = abs / MINOR_PER_MAJOR;
  const frac = abs % MINOR_PER_MAJOR;
  const fracStr = frac.toString().padStart(CURRENCY_DECIMALS, "0");

  const intl = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    useGrouping: true,
    maximumFractionDigits: 0,
  });
  const groupedInt = intl.format(major);
  // Localize fractional digits to match the numbering system of the locale.
  const localizedFrac =
    locale === "ar"
      ? new Intl.NumberFormat("ar-OM", { useGrouping: false }).format(BigInt(fracStr))
          .padStart(CURRENCY_DECIMALS, "٠")
      : fracStr;

  const decimalSep = locale === "ar" ? "٫" : ".";
  const sign = negative ? "-" : options?.showSign ? "+" : "";
  return `${sign}${groupedInt}${decimalSep}${localizedFrac}`;
}

function numberToDecimalString(n: number): string {
  if (!Number.isFinite(n)) throw new MoneyError("Amount must be a finite number.");
  // Avoid scientific notation for typical amounts.
  return n.toFixed(CURRENCY_DECIMALS);
}

/** Sum a list of minor-unit values. */
export function sumMinor(values: bigint[]): bigint {
  return values.reduce((acc, v) => acc + v, 0n);
}
