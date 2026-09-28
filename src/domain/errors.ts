/**
 * Domain-level error with a stable machine code plus translation keys so the UI
 * can present a safe, localized message without leaking internals.
 */
export type DomainErrorCode =
  | "not_found"
  | "forbidden"
  | "validation"
  | "conflict"
  | "invalid_state";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  /** Translation key for the user-facing message, e.g. "errors.account_not_found". */
  readonly messageKey: string;

  constructor(code: DomainErrorCode, messageKey: string, message?: string) {
    super(message ?? messageKey);
    this.name = "DomainError";
    this.code = code;
    this.messageKey = messageKey;
  }
}

export function notFound(messageKey: string): DomainError {
  return new DomainError("not_found", messageKey);
}
export function forbidden(messageKey: string): DomainError {
  return new DomainError("forbidden", messageKey);
}
export function validation(messageKey: string): DomainError {
  return new DomainError("validation", messageKey);
}
export function invalidState(messageKey: string): DomainError {
  return new DomainError("invalid_state", messageKey);
}
