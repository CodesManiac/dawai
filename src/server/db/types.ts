/**
 * Domain types owned by the learning database boundary.
 *
 * These are application contracts, not generated Supabase client types. The SQL
 * migrations remain the source of truth; regenerate client types when a linked
 * Supabase CLI is available and keep these mappings in sync.
 */

export const STUDY_PACK_STATUSES = ["active", "archived"] as const;
export type StudyPackStatus = (typeof STUDY_PACK_STATUSES)[number];

export const SOURCE_TYPES = ["document", "text", "webpage", "video"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_STATUSES = ["pending", "processing", "ready", "failed"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export type LearningPreferences = Record<string, unknown>;
export type SourceMetadata = Record<string, unknown>;

export type Profile = {
  id: string;
  displayName: string | null;
  learningPreferences: LearningPreferences;
  createdAt: string;
  updatedAt: string;
};

export type Course = {
  id: string;
  userId: string;
  code: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudyPack = {
  id: string;
  userId: string;
  courseId: string | null;
  title: string;
  description: string | null;
  status: StudyPackStatus;
  createdAt: string;
  updatedAt: string;
};

export type Source = {
  id: string;
  userId: string;
  studyPackId: string;
  type: SourceType;
  title: string;
  metadata: SourceMetadata;
  status: SourceStatus;
  failureMessage: string | null;
  storagePath: string | null;
  sourceUrl: string | null;
  textContent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudyPackListFilter = {
  /** `undefined` lists all packs; `null` lists packs without a course. */
  courseId?: string | null;
};
