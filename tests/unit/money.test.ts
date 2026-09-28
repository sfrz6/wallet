import { describe, it, expect } from "vitest";
import {
  formatMinor,
  minorToNumeric,
  numericToMinor,
  parseAmountToMinor,
  MoneyError,
  sumMinor,
} from "@/lib/money";

describe("money parsing", () => {
  it("parses whole numbers to baisa", () => {
    expect(parseAmountToMinor("5")).toBe(5000n);
    expect(parseAmountToMinor("900")).toBe(900000n);
  });

  it("parses three decimal places exactly", () => {
    expect(parseAmountToMinor("12.550")).toBe(12550n);
    expect(parseAmountToMinor("0.100")).toBe(100n);
    expect(parseAmountToMinor("0.001")).toBe(1n);
  });

  it("pads missing decimals", () => {
    expect(parseAmountToMinor("12.5")).toBe(12500n);
    expect(parseAmountToMinor("12.05")).toBe(12050n);
  });

  it("rejects more than three decimals", () => {
    expect(() => parseAmountToMinor("1.2345")).toThrow(MoneyError);
  });

  it("rejects non-numeric and negative input", () => {
    expect(() => parseAmountToMinor("abc")).toThrow(MoneyError);
    expect(() => parseAmountToMinor("-5")).toThrow(MoneyError);
    expect(() => parseAmountToMinor("")).toThrow(MoneyError);
  });
});

describe("money round-tripping", () => {
  it("round-trips through NUMERIC strings including sign", () => {
    expect(minorToNumeric(12550n)).toBe("12.550");
    expect(minorToNumeric(-12550n)).toBe("-12.550");
    expect(minorToNumeric(1n)).toBe("0.001");
    expect(numericToMinor("12.550")).toBe(12550n);
    expect(numericToMinor("-12.550")).toBe(-12550n);
    expect(numericToMinor("0")).toBe(0n);
  });

  it("has no floating point drift over many additions", () => {
    // 0.001 added 1000 times must equal exactly 1.000
    const values = Array.from({ length: 1000 }, () => 1n);
    expect(sumMinor(values)).toBe(1000n);
    expect(minorToNumeric(sumMinor(values))).toBe("1.000");
  });
});

describe("money formatting", () => {
  it("formats English with grouping and three decimals", () => {
    expect(formatMinor(1234567n, "en")).toBe("1,234.567");
    expect(formatMinor(995000n, "en")).toBe("995.000");
  });

  it("formats a signed value when requested", () => {
    expect(formatMinor(5000n, "en", { showSign: true })).toBe("+5.000");
    expect(formatMinor(-5000n, "en")).toBe("-5.000");
  });
});
