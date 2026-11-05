import type {
  CreateCourseInput,
  CreateSourceInput,
  CreateStudyPackInput,
  UpdateCourseInput,
  UpdateProfileInput,
  UpdateSourceInput,
  UpdateStudyPackInput,
} from "@/server/db/schemas";
import type { Course, Profile, Source, StudyPack, StudyPackListFilter } from "@/server/db/types";

/**
 * Repository contracts for the learning database.
 *
 * Implementations never accept a caller-supplied user ID. They operate through a
 * request-scoped, authenticated Supabase client; ownership is resolved by the
 * database from the verified JWT and enforced by RLS. Server callers should still
 * resolve the user with `requireUser()` before exposing a UI path.
 */

export interface ProfileRepository {
  get(): Promise<Profile | null>;
  update(input: UpdateProfileInput): Promise<Profile | null>;
}

export interface CourseRepository {
  list(): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
  create(input: CreateCourseInput): Promise<Course>;
  update(id: string, input: UpdateCourseInput): Promise<Course | null>;
  delete(id: string): Promise<boolean>;
}

export interface StudyPackRepository {
  list(filter?: StudyPackListFilter): Promise<StudyPack[]>;
  getById(id: string): Promise<StudyPack | null>;
  create(input: CreateStudyPackInput): Promise<StudyPack>;
  update(id: string, input: UpdateStudyPackInput): Promise<StudyPack | null>;
  delete(id: string): Promise<boolean>;
}

export interface SourceRepository {
  listByStudyPack(studyPackId: string): Promise<Source[]>;
  getById(id: string): Promise<Source | null>;
  create(input: CreateSourceInput): Promise<Source>;
  update(id: string, input: UpdateSourceInput): Promise<Source | null>;
  delete(id: string): Promise<boolean>;
}

export interface LearningRepositories {
  profiles: ProfileRepository;
  courses: CourseRepository;
  studyPacks: StudyPackRepository;
  sources: SourceRepository;
}
