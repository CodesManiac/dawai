/**
 * Document-processing boundary.
 *
 * Parsing, chunking, citation anchoring, and embedding orchestration belong in
 * this layer. Task 001 intentionally ships contracts only: no upload route, no
 * storage client, and no extraction dependencies.
 */
export type SourceKind = "document" | "webpage" | "video";

/** Where a piece of extracted text came from, in the source's own coordinates. */
export interface SourceLocator {
  kind: SourceKind;
  page?: number;
  timestampSeconds?: number;
  url?: string;
}

export interface SourceSegment {
  id: string;
  text: string;
  locator: SourceLocator;
}

export interface DocumentExtractor {
  supports(mimeType: string): boolean;
  extract(input: { data: Uint8Array; mimeType: string }): Promise<readonly SourceSegment[]>;
}
