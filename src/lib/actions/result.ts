import { ZodError } from "zod";
import { DomainError } from "@/domain/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Maps any thrown value to a safe user-facing translation key. */
export function toErrorKey(e: unknown): string {
  if (e instanceof DomainError) return e.messageKey;
  if (e instanceof ZodError) {
    return e.issues[0]?.message ?? "errors.invalid_input";
  }
  return "errors.generic";
}

/** Extracts per-field error keys from a ZodError. */
export function fieldErrorsFrom(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}
