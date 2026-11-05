/**
 * Safe repository errors.
 *
 * Database/provider messages can contain SQL fragments, column names, or data
 * values. Repositories map them to a small set of stable codes and user-safe
 * messages before returning control to a feature or Server Action.
 */

export const REPOSITORY_ERROR_CODES = [
  "invalid_input",
  "not_found",
  "conflict",
  "forbidden",
  "unavailable",
  "unknown",
] as const;

export type RepositoryErrorCode = (typeof REPOSITORY_ERROR_CODES)[number];

const SAFE_MESSAGES: Record<RepositoryErrorCode, string> = {
  invalid_input: "The provided data is invalid.",
  not_found: "The requested record was not found.",
  conflict: "That change conflicts with an existing record.",
  forbidden: "You do not have permission to perform this action.",
  unavailable: "The database request could not be completed. Please try again.",
  unknown: "The database request could not be completed.",
};

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly operation: string;

  constructor(code: RepositoryErrorCode, operation: string, options?: ErrorOptions) {
    super(SAFE_MESSAGES[code], options);
    this.name = "RepositoryError";
    this.code = code;
    this.operation = operation;
  }
}

type PostgrestLikeError = {
  code?: string;
  message?: string;
};

/**
 * Map PostgREST/Postgres errors without forwarding their raw message.
 *
 * 23503 is a foreign-key violation. In this schema that usually means a parent
 * row is missing, was deleted concurrently, or belongs to another user (the
 * composite same-owner foreign keys). All three are safe to report as conflict.
 */
export function mapRepositoryError(
  error: PostgrestLikeError | null | undefined,
  operation: string,
): RepositoryError {
  switch (error?.code) {
    case "23505":
      return new RepositoryError("conflict", operation, { cause: error });
    case "23503":
      return new RepositoryError("conflict", operation, { cause: error });
    case "23514":
      return new RepositoryError("invalid_input", operation, { cause: error });
    case "42501":
    case "PGRST301":
    case "PGRST302":
      return new RepositoryError("forbidden", operation, { cause: error });
    case "PGRST116":
      return new RepositoryError("not_found", operation, { cause: error });
    default:
      if (error?.code?.startsWith("08")) {
        return new RepositoryError("unavailable", operation, { cause: error });
      }

      return new RepositoryError("unknown", operation, { cause: error });
  }
}

export function invalidRepositoryInput(operation: string, cause?: unknown): RepositoryError {
  return new RepositoryError("invalid_input", operation, { cause });
}
