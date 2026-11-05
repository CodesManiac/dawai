import { describe, expect, it } from "vitest";

import { mapRepositoryError, RepositoryError } from "@/server/db/errors";

describe("repository error mapping", () => {
  it.each([
    ["23505", "conflict"],
    ["23503", "conflict"],
    ["23514", "invalid_input"],
    ["42501", "forbidden"],
    ["PGRST301", "forbidden"],
    ["PGRST302", "forbidden"],
    ["PGRST116", "not_found"],
    ["08006", "unavailable"],
  ] as const)("maps %s to %s", (code, expected) => {
    const error = mapRepositoryError({ code, message: "raw database detail" }, "test.operation");

    expect(error).toBeInstanceOf(RepositoryError);
    expect(error.code).toBe(expected);
    expect(error.operation).toBe("test.operation");
  });

  it("never copies a raw provider message into the user-facing message", () => {
    const error = mapRepositoryError(
      { code: "XX000", message: 'relation "private_table" does not exist' },
      "test.operation",
    );

    expect(error.code).toBe("unknown");
    expect(error.message).toBe("The database request could not be completed.");
    expect(error.message).not.toContain("private_table");
  });

  it("preserves raw details only as an internal cause", () => {
    const raw = { code: "23505", message: "duplicate key value" };
    const error = mapRepositoryError(raw, "test.operation");

    expect(error.cause).toBe(raw);
    expect(error.message).not.toContain("duplicate key");
  });
});
