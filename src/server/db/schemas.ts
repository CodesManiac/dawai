import { z } from "zod";

import {
  SOURCE_STATUSES,
  SOURCE_TYPES,
  STUDY_PACK_STATUSES,
  type SourceType,
} from "@/server/db/types";

export const uuidSchema = z.uuid({
  error: "Enter a valid identifier.",
});

const titleSchema = z
  .string({ error: "Enter a title." })
  .trim()
  .min(1, { error: "Enter a title." })
  .max(200, { error: "Use 200 characters or fewer." });

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(5000, { error: "Use 5000 characters or fewer." })
  .nullable()
  .optional();

const optionalCodeSchema = z
  .string()
  .trim()
  .max(40, { error: "Use 40 characters or fewer." })
  .nullable()
  .optional();

const optionalDisplayNameSchema = z
  .string()
  .trim()
  .max(80, { error: "Use 80 characters or fewer." })
  .nullable()
  .optional();

const metadataSchema = z.record(z.string(), z.unknown());

const optionalStoragePathSchema = z
  .string()
  .trim()
  .max(1024, { error: "Use 1024 characters or fewer." })
  .nullable()
  .optional();

const optionalSourceTextSchema = z
  .string()
  .max(1_000_000, { error: "Use 1,000,000 characters or fewer." })
  .nullable()
  .optional();

const optionalFailureMessageSchema = z
  .string()
  .trim()
  .max(2000, { error: "Use 2000 characters or fewer." })
  .nullable()
  .optional();

const optionalSourceUrlSchema = z
  .string()
  .trim()
  .max(2048, { error: "Use 2048 characters or fewer." })
  .refine((value) => value.length === 0 || /^https?:\/\/\S+$/i.test(value), {
    error: "Enter a valid http(s) URL.",
  })
  .nullable()
  .optional();

function hasAtLeastOneValue(values: Record<string, unknown>): boolean {
  return Object.values(values).some((value) => value !== undefined);
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasReadyLocator(values: {
  type: SourceType;
  storagePath?: string | null;
  sourceUrl?: string | null;
  textContent?: string | null;
}): boolean {
  if (values.type === "document") {
    return hasText(values.storagePath);
  }

  if (values.type === "text") {
    return hasText(values.textContent);
  }

  return hasText(values.sourceUrl);
}

export const profileUpdateSchema = z
  .object({
    displayName: optionalDisplayNameSchema,
    learningPreferences: metadataSchema.optional(),
  })
  .refine(hasAtLeastOneValue, {
    error: "Provide at least one profile field to update.",
  });

export const courseCreateSchema = z.object({
  code: optionalCodeSchema,
  title: titleSchema,
  description: optionalDescriptionSchema,
});

export const courseUpdateSchema = courseCreateSchema.partial().refine(hasAtLeastOneValue, {
  error: "Provide at least one course field to update.",
});

export const studyPackCreateSchema = z.object({
  courseId: uuidSchema.nullable().optional(),
  title: titleSchema,
  description: optionalDescriptionSchema,
  status: z.enum(STUDY_PACK_STATUSES).optional(),
});

export const studyPackUpdateSchema = studyPackCreateSchema.partial().refine(hasAtLeastOneValue, {
  error: "Provide at least one study pack field to update.",
});

const sourceCreateShape = {
  studyPackId: uuidSchema,
  type: z.enum(SOURCE_TYPES),
  title: titleSchema,
  metadata: metadataSchema.optional(),
  status: z.enum(SOURCE_STATUSES).optional(),
  failureMessage: optionalFailureMessageSchema,
  storagePath: optionalStoragePathSchema,
  sourceUrl: optionalSourceUrlSchema,
  textContent: optionalSourceTextSchema,
};

export const sourceCreateSchema = z.object(sourceCreateShape).superRefine((value, context) => {
  if (value.type === "document" && hasText(value.sourceUrl)) {
    context.addIssue({
      code: "custom",
      path: ["sourceUrl"],
      message: "Document sources use a storage path, not a URL.",
    });
  }

  if (value.type === "text" && (hasText(value.storagePath) || hasText(value.sourceUrl))) {
    context.addIssue({
      code: "custom",
      path: ["type"],
      message: "Text sources use pasted text, not a storage path or URL.",
    });
  }

  if (
    (value.type === "webpage" || value.type === "video") &&
    (hasText(value.storagePath) || hasText(value.textContent))
  ) {
    context.addIssue({
      code: "custom",
      path: ["type"],
      message: "Web and video sources use a URL, not a storage path or pasted text.",
    });
  }

  if (value.status === "failed" && !hasText(value.failureMessage)) {
    context.addIssue({
      code: "custom",
      path: ["failureMessage"],
      message: "Explain why the source failed.",
    });
  }

  if (value.status !== "failed" && hasText(value.failureMessage)) {
    context.addIssue({
      code: "custom",
      path: ["failureMessage"],
      message: "Failure details require a failed source status.",
    });
  }

  if (value.status === "ready" && !hasReadyLocator(value)) {
    context.addIssue({
      code: "custom",
      path: ["status"],
      message: "A ready source needs its matching storage path, URL, or pasted text.",
    });
  }
});

export const sourceUpdateSchema = z.object(sourceCreateShape).partial().refine(hasAtLeastOneValue, {
  error: "Provide at least one source field to update.",
});

export const studyPackListFilterSchema = z.object({
  courseId: uuidSchema.nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof profileUpdateSchema>;
export type CreateCourseInput = z.infer<typeof courseCreateSchema>;
export type UpdateCourseInput = z.infer<typeof courseUpdateSchema>;
export type CreateStudyPackInput = z.infer<typeof studyPackCreateSchema>;
export type UpdateStudyPackInput = z.infer<typeof studyPackUpdateSchema>;
export type CreateSourceInput = z.infer<typeof sourceCreateSchema>;
export type UpdateSourceInput = z.infer<typeof sourceUpdateSchema>;
export type StudyPackListFilterInput = z.infer<typeof studyPackListFilterSchema>;
