/**
 * Shared types used across the Pickr application
 */

// Brotli compression instance type
export type BrotliInstance = {
    compress: (buf: Uint8Array, options?: any) => Uint8Array;
    decompress: (buf: Uint8Array) => Uint8Array;
};

// Single candidate item
export interface CandidateItem {
    uuid: string;
    text: string;
}

// Single group item
export interface GroupItem {
    uuid: string;
    name: string;
}

// Tab modes
export type TabMode = "list" | "groups";

// Groups configuration options
export interface GroupsConfig {
    maxPerGroup: number | null;
}

// Result of group distribution
export interface GroupAssignment {
    group: GroupItem;
    candidates: CandidateItem[];
}

// Compressed payload for URL sharing
export interface CompressedPayload {
    mode: TabMode;
    t: string; // target datetime ISO string
    c: string[]; // candidate texts
    g?: string[]; // group names (for groups mode)
    m?: number | null; // max per group (for groups mode)
}

// App-wide constants
export const MAX_LIST_CANDIDATES = 10;
export const MAX_GROUPS = 10;
export const MAX_GROUP_CANDIDATES = 20;

// Drand Mainnet Chain Hash
export const DRAND_CHAIN_HASH =
    "8990e7a9aaed2f3b507c95208331d5dd0c99db496340696d090954a4bbe93481";
