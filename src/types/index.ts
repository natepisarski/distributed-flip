/**
 * Shared types used across the Pickr application
 */

// App-wide constants
export const MAX_LIST_CANDIDATES = 10;
export const MAX_GROUPS = 10;
export const MAX_GROUP_CANDIDATES = 20;

/**
 * Brotli compression bindings
 */
export type BrotliInstance = {
  compress: (buf: Uint8Array, options?: any) => Uint8Array;
  decompress: (buf: Uint8Array) => Uint8Array;
};

/**
 * A single candidate item, in either Group or List mode.
 */
export interface CandidateItem {
  uuid: string;
  text: string;
}

/**
 * A single group for Group mode. These are the "buckets" that candidates get assigned to.
 */
export interface GroupItem {
  uuid: string;
  name: string;
}

/**
 * Which Mode is currently being used.
 * - "list" = simple list of candidates, one is chosen as a winner
 * - "groups" = candidates are assigned into groups
 */
export type TabMode = "list" | "groups";

/**
 * Group Configuration Options
 */
export interface GroupsConfig {
  maxPerGroup: number | null;
}

/**
 * List Configuration Options
 */
export interface ListConfig {
  numberOfWinners: number;
}

/**
 * Interface representing the groups and their assigned candidates
 */
export interface GroupAssignment {
  group: GroupItem;
  candidates: CandidateItem[];
}

/**
 * Compressed Payload Structure. This is the 'p' parameter in the URL, after Brotli decompression and JSON parsing.
 */
export interface CompressedPayload {
  mode: TabMode;
  t: string; // target datetime ISO string
  c: string[]; // candidate texts
  g?: string[]; // group names (for groups mode)
  m?: number | null; // max per group (for groups mode)
  nw?: number; // number of winners (for list mode)
}
