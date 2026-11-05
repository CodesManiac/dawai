import { describe, expect, it } from "vitest";

import {
  courseCreateSchema,
  courseUpdateSchema,
  profileUpdateSchema,
  sourceCreateSchema,
  studyPackCreateSchema,
  uuidSchema,
} from "@/server/db/schemas";

const STUDY_PACK_ID = "33333333-3333-4333-8333-333333333333";

describe("learning input schemas", () => {
  it("trims user text and accepts nullable optional fields", () => {
    const result = courseCreateSchema.parse({
      title: "  Biology  ",
      code: "  BIO101  ",
      description: "",
    });

    expect(result).toEqual({
      title: "Biology",
      code: "BIO101",
      description: "",
    });
  });

  it("rejects an empty title and malformed identifiers", () => {
    expect(courseCreateSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("requires at least one field in an update", () => {
    expect(courseUpdateSchema.safeParse({}).success).toBe(false);
    expect(courseUpdateSchema.safeParse({ title: undefined }).success).toBe(false);
    expect(courseUpdateSchema.safeParse({ title: "New title" }).success).toBe(true);
    expect(profileUpdateSchema.safeParse({}).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ displayName: null }).success).toBe(true);
  });

  it("validates source locator and failure-state combinations", () => {
    expect(
      sourceCreateSchema.safeParse({
        studyPackId: STUDY_PACK_ID,
        type: "text",
        title: "Notes",
        textContent: "A note",
      }).success,
    ).toBe(true);

    expect(
      sourceCreateSchema.safeParse({
        studyPackId: STUDY_PACK_ID,
        type: "webpage",
        title: "A page",
        textContent: "wrong locator",
      }).success,
    ).toBe(false);

    expect(
      sourceCreateSchema.safeParse({
        studyPackId: STUDY_PACK_ID,
        type: "text",
        title: "Notes",
        status: "failed",
      }).success,
    ).toBe(false);

    expect(
      sourceCreateSchema.safeParse({
        studyPackId: STUDY_PACK_ID,
        type: "text",
        title: "Notes",
        status: "ready",
        textContent: "A note",
      }).success,
    ).toBe(true);

    expect(
      sourceCreateSchema.safeParse({
        studyPackId: STUDY_PACK_ID,
        type: "webpage",
        title: "A page",
        status: "ready",
      }).success,
    ).toBe(false);
  });

  it("accepts a course-less study pack", () => {
    expect(studyPackCreateSchema.safeParse({ title: "Standalone" }).success).toBe(true);
  });
});
