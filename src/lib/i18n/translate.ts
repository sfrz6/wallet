import type { Dictionary } from "./dictionaries";

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolve(dict: any, path: string): unknown {
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/** Builds a translation function over a single locale's dictionary. */
export function createTranslator(dict: Dictionary): TFunction {
  return (key, params) => {
    const value = resolve(dict, key);
    if (typeof value === "string") return interpolate(value, params);
    // Fall back to the key itself so a missing translation is visible but safe.
    return key;
  };
}
