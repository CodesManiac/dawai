import "server-only";

import type { SupabaseServerClient } from "@/server/supabase/server";

import type {
  CourseRepository,
  LearningRepositories,
  ProfileRepository,
  SourceRepository,
  StudyPackRepository,
} from "@/server/db/contracts";
import { invalidRepositoryInput, mapRepositoryError, RepositoryError } from "@/server/db/errors";
import {
  courseCreateSchema,
  courseUpdateSchema,
  profileUpdateSchema,
  sourceCreateSchema,
  sourceUpdateSchema,
  studyPackCreateSchema,
  studyPackListFilterSchema,
  studyPackUpdateSchema,
  uuidSchema,
  type CreateCourseInput,
  type CreateSourceInput,
  type CreateStudyPackInput,
  type UpdateCourseInput,
  type UpdateProfileInput,
  type UpdateSourceInput,
  type UpdateStudyPackInput,
} from "@/server/db/schemas";
import type {
  Course,
  Profile,
  Source,
  SourceStatus,
  SourceType,
  StudyPack,
  StudyPackListFilter,
  StudyPackStatus,
} from "@/server/db/types";

type DatabaseError = {
  code?: string;
  message?: string;
};

type Parser<T> = {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: unknown };
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  learning_preferences: unknown;
  created_at: string;
  updated_at: string;
};

type CourseRow = {
  id: string;
  user_id: string;
  code: string | null;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type StudyPackRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type SourceRow = {
  id: string;
  user_id: string;
  study_pack_id: string;
  source_type: string;
  title: string;
  metadata: unknown;
  status: string;
  failure_message: string | null;
  storage_path: string | null;
  source_url: string | null;
  text_content: string | null;
  created_at: string;
  updated_at: string;
};

function parseOrThrow<T>(schema: Parser<T>, value: unknown, operation: string): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw invalidRepositoryInput(operation, result.error);
  }

  return result.data;
}

function parseId(id: string, operation: string): string {
  return parseOrThrow(uuidSchema, id, operation);
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableSourceText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.trim().length > 0 ? value : null;
}

/**
 * The request-scoped Supabase client is intentionally untyped because this task
 * does not have generated database types yet. These helpers keep the unknown
 * payload at the boundary and apply the row contract once.
 */
function requireRow<T>(data: unknown, error: DatabaseError | null, operation: string): T {
  if (error) {
    throw mapRepositoryError(error, operation);
  }

  if (data === null || data === undefined) {
    throw new RepositoryError("not_found", operation);
  }

  return data as T;
}

function optionalRow<T>(data: unknown, error: DatabaseError | null, operation: string): T | null {
  if (error) {
    throw mapRepositoryError(error, operation);
  }

  return data === null || data === undefined ? null : (data as T);
}

function listRows<T>(data: unknown, error: DatabaseError | null, operation: string): T[] {
  if (error) {
    throw mapRepositoryError(error, operation);
  }

  return Array.isArray(data) ? (data as T[]) : [];
}

function deletedRow(data: unknown, error: DatabaseError | null, operation: string): boolean {
  if (error) {
    throw mapRepositoryError(error, operation);
  }

  return Array.isArray(data) && data.length > 0;
}

function assertPatchHasValues(patch: Record<string, unknown>, operation: string): void {
  if (Object.keys(patch).length === 0) {
    throw invalidRepositoryInput(operation);
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    learningPreferences: asObject(row.learning_preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudyPack(row: StudyPackRow): StudyPack {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    status: row.status as StudyPackStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSource(row: SourceRow): Source {
  return {
    id: row.id,
    userId: row.user_id,
    studyPackId: row.study_pack_id,
    type: row.source_type as SourceType,
    title: row.title,
    metadata: asObject(row.metadata),
    status: row.status as SourceStatus,
    failureMessage: row.failure_message,
    storagePath: row.storage_path,
    sourceUrl: row.source_url,
    textContent: row.text_content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async get(): Promise<Profile | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").maybeSingle();

    const row = optionalRow<ProfileRow>(data, error, "profiles.get");
    return row ? mapProfile(row) : null;
  }

  async update(input: UpdateProfileInput): Promise<Profile | null> {
    const operation = "profiles.update";
    const parsed = parseOrThrow(profileUpdateSchema, input, operation);
    const patch: Record<string, unknown> = {};

    if (parsed.displayName !== undefined) {
      patch.display_name = nullableText(parsed.displayName);
    }

    if (parsed.learningPreferences !== undefined) {
      patch.learning_preferences = parsed.learningPreferences;
    }

    assertPatchHasValues(patch, operation);

    const { data, error } = await this.supabase
      .from("profiles")
      .update(patch)
      .select("*")
      .maybeSingle();

    const row = optionalRow<ProfileRow>(data, error, operation);
    return row ? mapProfile(row) : null;
  }
}

class SupabaseCourseRepository implements CourseRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(): Promise<Course[]> {
    const { data, error } = await this.supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    return listRows<CourseRow>(data, error, "courses.list").map(mapCourse);
  }

  async getById(id: string): Promise<Course | null> {
    const operation = "courses.getById";
    const courseId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    const row = optionalRow<CourseRow>(data, error, operation);
    return row ? mapCourse(row) : null;
  }

  async create(input: CreateCourseInput): Promise<Course> {
    const operation = "courses.create";
    const parsed = parseOrThrow(courseCreateSchema, input, operation);
    const { data, error } = await this.supabase
      .from("courses")
      .insert({
        code: nullableText(parsed.code),
        title: parsed.title,
        description: nullableText(parsed.description),
      })
      .select("*")
      .single();

    return mapCourse(requireRow<CourseRow>(data, error, operation));
  }

  async update(id: string, input: UpdateCourseInput): Promise<Course | null> {
    const operation = "courses.update";
    const courseId = parseId(id, operation);
    const parsed = parseOrThrow(courseUpdateSchema, input, operation);
    const patch: Record<string, unknown> = {};

    if (parsed.title !== undefined) {
      patch.title = parsed.title;
    }

    if (parsed.code !== undefined) {
      patch.code = nullableText(parsed.code);
    }

    if (parsed.description !== undefined) {
      patch.description = nullableText(parsed.description);
    }

    assertPatchHasValues(patch, operation);

    const { data, error } = await this.supabase
      .from("courses")
      .update(patch)
      .eq("id", courseId)
      .select("*")
      .maybeSingle();

    const row = optionalRow<CourseRow>(data, error, operation);
    return row ? mapCourse(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const operation = "courses.delete";
    const courseId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("courses")
      .delete()
      .eq("id", courseId)
      .select("id");

    return deletedRow(data, error, operation);
  }
}

class SupabaseStudyPackRepository implements StudyPackRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(filter?: StudyPackListFilter): Promise<StudyPack[]> {
    const operation = "studyPacks.list";
    const parsed = parseOrThrow(studyPackListFilterSchema, filter ?? {}, operation);
    let query = this.supabase.from("study_packs").select("*");

    if (parsed.courseId === null) {
      query = query.is("course_id", null);
    } else if (parsed.courseId !== undefined) {
      query = query.eq("course_id", parsed.courseId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    return listRows<StudyPackRow>(data, error, operation).map(mapStudyPack);
  }

  async getById(id: string): Promise<StudyPack | null> {
    const operation = "studyPacks.getById";
    const studyPackId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("study_packs")
      .select("*")
      .eq("id", studyPackId)
      .maybeSingle();

    const row = optionalRow<StudyPackRow>(data, error, operation);
    return row ? mapStudyPack(row) : null;
  }

  async create(input: CreateStudyPackInput): Promise<StudyPack> {
    const operation = "studyPacks.create";
    const parsed = parseOrThrow(studyPackCreateSchema, input, operation);
    const insert: Record<string, unknown> = {
      course_id: parsed.courseId ?? null,
      title: parsed.title,
      description: nullableText(parsed.description),
    };

    if (parsed.status !== undefined) {
      insert.status = parsed.status;
    }

    const { data, error } = await this.supabase
      .from("study_packs")
      .insert(insert)
      .select("*")
      .single();

    return mapStudyPack(requireRow<StudyPackRow>(data, error, operation));
  }

  async update(id: string, input: UpdateStudyPackInput): Promise<StudyPack | null> {
    const operation = "studyPacks.update";
    const studyPackId = parseId(id, operation);
    const parsed = parseOrThrow(studyPackUpdateSchema, input, operation);
    const patch: Record<string, unknown> = {};

    if (parsed.courseId !== undefined) {
      patch.course_id = parsed.courseId;
    }

    if (parsed.title !== undefined) {
      patch.title = parsed.title;
    }

    if (parsed.description !== undefined) {
      patch.description = nullableText(parsed.description);
    }

    if (parsed.status !== undefined) {
      patch.status = parsed.status;
    }

    assertPatchHasValues(patch, operation);

    const { data, error } = await this.supabase
      .from("study_packs")
      .update(patch)
      .eq("id", studyPackId)
      .select("*")
      .maybeSingle();

    const row = optionalRow<StudyPackRow>(data, error, operation);
    return row ? mapStudyPack(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const operation = "studyPacks.delete";
    const studyPackId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("study_packs")
      .delete()
      .eq("id", studyPackId)
      .select("id");

    return deletedRow(data, error, operation);
  }
}

class SupabaseSourceRepository implements SourceRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listByStudyPack(studyPackId: string): Promise<Source[]> {
    const operation = "sources.listByStudyPack";
    const packId = parseId(studyPackId, operation);
    const { data, error } = await this.supabase
      .from("sources")
      .select("*")
      .eq("study_pack_id", packId)
      .order("created_at", { ascending: false });

    return listRows<SourceRow>(data, error, operation).map(mapSource);
  }

  async getById(id: string): Promise<Source | null> {
    const operation = "sources.getById";
    const sourceId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("sources")
      .select("*")
      .eq("id", sourceId)
      .maybeSingle();

    const row = optionalRow<SourceRow>(data, error, operation);
    return row ? mapSource(row) : null;
  }

  async create(input: CreateSourceInput): Promise<Source> {
    const operation = "sources.create";
    const parsed = parseOrThrow(sourceCreateSchema, input, operation);
    const insert: Record<string, unknown> = {
      study_pack_id: parsed.studyPackId,
      source_type: parsed.type,
      title: parsed.title,
      metadata: parsed.metadata ?? {},
      failure_message: nullableText(parsed.failureMessage),
      storage_path: nullableText(parsed.storagePath),
      source_url: nullableText(parsed.sourceUrl),
      text_content: nullableSourceText(parsed.textContent),
    };

    if (parsed.status !== undefined) {
      insert.status = parsed.status;
    }

    const { data, error } = await this.supabase.from("sources").insert(insert).select("*").single();

    return mapSource(requireRow<SourceRow>(data, error, operation));
  }

  async update(id: string, input: UpdateSourceInput): Promise<Source | null> {
    const operation = "sources.update";
    const sourceId = parseId(id, operation);
    const parsed = parseOrThrow(sourceUpdateSchema, input, operation);
    const patch: Record<string, unknown> = {};

    if (parsed.studyPackId !== undefined) {
      patch.study_pack_id = parsed.studyPackId;
    }

    if (parsed.type !== undefined) {
      patch.source_type = parsed.type;
    }

    if (parsed.title !== undefined) {
      patch.title = parsed.title;
    }

    if (parsed.metadata !== undefined) {
      patch.metadata = parsed.metadata;
    }

    if (parsed.status !== undefined) {
      patch.status = parsed.status;
    }

    if (parsed.failureMessage !== undefined) {
      patch.failure_message = nullableText(parsed.failureMessage);
    }

    if (parsed.storagePath !== undefined) {
      patch.storage_path = nullableText(parsed.storagePath);
    }

    if (parsed.sourceUrl !== undefined) {
      patch.source_url = nullableText(parsed.sourceUrl);
    }

    if (parsed.textContent !== undefined) {
      patch.text_content = nullableSourceText(parsed.textContent);
    }

    assertPatchHasValues(patch, operation);

    const { data, error } = await this.supabase
      .from("sources")
      .update(patch)
      .eq("id", sourceId)
      .select("*")
      .maybeSingle();

    const row = optionalRow<SourceRow>(data, error, operation);
    return row ? mapSource(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const operation = "sources.delete";
    const sourceId = parseId(id, operation);
    const { data, error } = await this.supabase
      .from("sources")
      .delete()
      .eq("id", sourceId)
      .select("id");

    return deletedRow(data, error, operation);
  }
}

/**
 * Build repositories from a request-scoped Supabase client.
 *
 * The client must be created with `createSupabaseServerClient()` and carry the
 * current user's session. Do not pass a service-role client or a client created
 * in module scope. Repository methods do not accept user IDs: the database uses
 * auth.uid() from the verified JWT for defaults, checks, and RLS.
 */
export function createLearningRepositories(supabase: SupabaseServerClient): LearningRepositories {
  return {
    profiles: new SupabaseProfileRepository(supabase),
    courses: new SupabaseCourseRepository(supabase),
    studyPacks: new SupabaseStudyPackRepository(supabase),
    sources: new SupabaseSourceRepository(supabase),
  };
}
