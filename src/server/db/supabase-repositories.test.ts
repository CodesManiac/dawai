import type { SupabaseServerClient } from "@/server/supabase/server";
import { describe, expect, it, vi } from "vitest";

import { RepositoryError } from "@/server/db/errors";
import { createLearningRepositories } from "@/server/db/supabase-repositories";

type QueryResult = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

type QueryCall = {
  method: string;
  args: unknown[];
};

class FakeQuery implements PromiseLike<QueryResult> {
  readonly calls: QueryCall[] = [];

  constructor(private readonly result: QueryResult) {}

  select(...args: unknown[]): this {
    this.calls.push({ method: "select", args });
    return this;
  }

  insert(...args: unknown[]): this {
    this.calls.push({ method: "insert", args });
    return this;
  }

  update(...args: unknown[]): this {
    this.calls.push({ method: "update", args });
    return this;
  }

  delete(...args: unknown[]): this {
    this.calls.push({ method: "delete", args });
    return this;
  }

  eq(...args: unknown[]): this {
    this.calls.push({ method: "eq", args });
    return this;
  }

  is(...args: unknown[]): this {
    this.calls.push({ method: "is", args });
    return this;
  }

  order(...args: unknown[]): this {
    this.calls.push({ method: "order", args });
    return this;
  }

  single(): this {
    this.calls.push({ method: "single", args: [] });
    return this;
  }

  maybeSingle(): this {
    this.calls.push({ method: "maybeSingle", args: [] });
    return this;
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

function createFakeClient(result: QueryResult = { data: null, error: null }) {
  const queries: FakeQuery[] = [];
  const from = vi.fn((table: string) => {
    void table;
    const query = new FakeQuery(result);
    queries.push(query);
    return query;
  });

  return {
    client: { from } as unknown as SupabaseServerClient,
    from,
    queries,
  };
}

const USER_ID = "11111111-1111-4111-8111-111111111111";
const COURSE_ID = "22222222-2222-4222-8222-222222222222";
const STUDY_PACK_ID = "33333333-3333-4333-8333-333333333333";
const SOURCE_ID = "44444444-4444-4444-8444-444444444444";
const PROFILE_ID = "55555555-5555-4555-8555-555555555555";

const COURSE_ROW = {
  id: COURSE_ID,
  user_id: USER_ID,
  code: "BIO101",
  title: "Biology",
  description: "Foundations",
  created_at: "2026-11-02T00:00:00.000Z",
  updated_at: "2026-11-02T00:00:00.000Z",
};

const STUDY_PACK_ROW = {
  id: STUDY_PACK_ID,
  user_id: USER_ID,
  course_id: COURSE_ID,
  title: "Cells",
  description: "Unit one",
  status: "active",
  created_at: "2026-11-02T00:00:00.000Z",
  updated_at: "2026-11-02T00:00:00.000Z",
};

const SOURCE_ROW = {
  id: SOURCE_ID,
  user_id: USER_ID,
  study_pack_id: STUDY_PACK_ID,
  source_type: "text",
  title: "Cell notes",
  metadata: { language: "en" },
  status: "pending",
  failure_message: null,
  storage_path: null,
  source_url: null,
  text_content: "Cells are the unit of life.",
  created_at: "2026-11-02T00:00:00.000Z",
  updated_at: "2026-11-02T00:00:00.000Z",
};

function hasCall(query: FakeQuery, method: string): QueryCall | undefined {
  return query.calls.find((call) => call.method === method);
}

describe("course repository", () => {
  it("creates a course without accepting a user id", async () => {
    const { client, from, queries } = createFakeClient({ data: COURSE_ROW, error: null });
    const repositories = createLearningRepositories(client);

    const course = await repositories.courses.create({
      title: "  Biology  ",
      code: "  ",
      description: "  ",
    });

    expect(from).toHaveBeenCalledWith("courses");
    expect(hasCall(queries[0], "insert")?.args).toEqual([
      { code: null, title: "Biology", description: null },
    ]);
    expect(course).toMatchObject({
      id: COURSE_ID,
      userId: USER_ID,
      title: "Biology",
      code: "BIO101",
    });
  });

  it("list maps database rows to camelCase domain objects", async () => {
    const { client } = createFakeClient({ data: [COURSE_ROW], error: null });
    const repositories = createLearningRepositories(client);

    await expect(repositories.courses.list()).resolves.toEqual([
      {
        id: COURSE_ID,
        userId: USER_ID,
        code: "BIO101",
        title: "Biology",
        description: "Foundations",
        createdAt: "2026-11-02T00:00:00.000Z",
        updatedAt: "2026-11-02T00:00:00.000Z",
      },
    ]);
  });

  it("rejects malformed ids before touching the database", async () => {
    const { client, from } = createFakeClient();
    const repositories = createLearningRepositories(client);

    await expect(repositories.courses.getById("not-a-uuid")).rejects.toMatchObject({
      name: "RepositoryError",
      code: "invalid_input",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("returns null when an update is invisible to RLS or the row is missing", async () => {
    const { client, queries } = createFakeClient({ data: null, error: null });
    const repositories = createLearningRepositories(client);

    await expect(
      repositories.courses.update(COURSE_ID, { description: "  new description  " }),
    ).resolves.toBeNull();

    expect(hasCall(queries[0], "update")?.args).toEqual([{ description: "new description" }]);
    expect(hasCall(queries[0], "eq")?.args).toEqual(["id", COURSE_ID]);
  });

  it("maps a duplicate-key database error to a safe conflict", async () => {
    const { client } = createFakeClient({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const repositories = createLearningRepositories(client);

    try {
      await repositories.courses.create({ title: "Biology" });
      throw new Error("Expected RepositoryError");
    } catch (error) {
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toMatchObject({ code: "conflict" });
      expect((error as Error).message).not.toContain("duplicate key");
    }
  });
});

describe("study pack repository", () => {
  it("filters packs without a course with IS NULL", async () => {
    const { client, queries } = createFakeClient({ data: [], error: null });
    const repositories = createLearningRepositories(client);

    await repositories.studyPacks.list({ courseId: null });

    expect(hasCall(queries[0], "is")?.args).toEqual(["course_id", null]);
  });

  it("creates a pack with an optional course and status", async () => {
    const { client, queries } = createFakeClient({ data: STUDY_PACK_ROW, error: null });
    const repositories = createLearningRepositories(client);

    const pack = await repositories.studyPacks.create({
      title: "Cells",
      courseId: COURSE_ID,
      status: "archived",
    });

    expect(hasCall(queries[0], "insert")?.args).toEqual([
      {
        course_id: COURSE_ID,
        title: "Cells",
        description: null,
        status: "archived",
      },
    ]);
    expect(pack).toMatchObject({ id: STUDY_PACK_ID, status: "active" });
  });
});

describe("source repository", () => {
  it("creates a source with a type-appropriate locator", async () => {
    const { client, queries } = createFakeClient({ data: SOURCE_ROW, error: null });
    const repositories = createLearningRepositories(client);

    const source = await repositories.sources.create({
      studyPackId: STUDY_PACK_ID,
      type: "text",
      title: "Cell notes",
      textContent: "Cells are the unit of life.",
      metadata: { language: "en" },
    });

    expect(hasCall(queries[0], "insert")?.args).toEqual([
      {
        study_pack_id: STUDY_PACK_ID,
        source_type: "text",
        title: "Cell notes",
        metadata: { language: "en" },
        failure_message: null,
        storage_path: null,
        source_url: null,
        text_content: "Cells are the unit of life.",
      },
    ]);
    expect(source).toMatchObject({ id: SOURCE_ID, type: "text", status: "pending" });
  });

  it("rejects an incompatible locator before touching the database", async () => {
    const { client, from } = createFakeClient();
    const repositories = createLearningRepositories(client);

    await expect(
      repositories.sources.create({
        studyPackId: STUDY_PACK_ID,
        type: "webpage",
        title: "A page",
        textContent: "not a web source",
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect(from).not.toHaveBeenCalled();
  });

  it("requires a locator when a source is marked ready", async () => {
    const { client, from } = createFakeClient();
    const repositories = createLearningRepositories(client);

    await expect(
      repositories.sources.create({
        studyPackId: STUDY_PACK_ID,
        type: "document",
        title: "A document",
        status: "ready",
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect(from).not.toHaveBeenCalled();
  });
});

describe("profile repository", () => {
  it("maps and updates only user-editable profile fields", async () => {
    const { client, queries } = createFakeClient({
      data: {
        id: PROFILE_ID,
        display_name: "Ada",
        learning_preferences: { theme: "dark" },
        created_at: "2026-11-02T00:00:00.000Z",
        updated_at: "2026-11-02T00:00:00.000Z",
      },
      error: null,
    });
    const repositories = createLearningRepositories(client);

    const profile = await repositories.profiles.update({
      displayName: "  Ada  ",
      learningPreferences: { theme: "dark" },
    });

    expect(hasCall(queries[0], "update")?.args).toEqual([
      { display_name: "Ada", learning_preferences: { theme: "dark" } },
    ]);
    expect(profile).toMatchObject({ id: PROFILE_ID, displayName: "Ada" });
  });

  it("returns null when the current profile is missing", async () => {
    const { client } = createFakeClient({ data: null, error: null });
    const repositories = createLearningRepositories(client);

    await expect(repositories.profiles.get()).resolves.toBeNull();
  });
});
