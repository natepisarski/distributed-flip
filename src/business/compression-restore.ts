import {
  BrotliInstance,
  CandidateItem,
  CompressedPayload,
  GroupsConfig, ListConfig,
} from "../types";
import {PickrMode} from "../types/enums";

// Legacy format for backwards compatibility
interface LegacyPayload {
  t: string;
  c: string[];
}

export interface ListRestoration {
  mode: "list";
  targetDatetime: string;
  candidates: CandidateItem[];
  config: ListConfig;
}

/**
 * Format for links to Group mode
 */
export interface GroupsRestoration {
  mode: "groups";
  targetDatetime: string;
  candidates: CandidateItem[];
  groups: Array<{ uuid: string; name: string }>;
  config: GroupsConfig;
}

export type CompressionRestoration = ListRestoration | GroupsRestoration;

/**
 * Given the compressed data string, we restore the original state.
 * Supports both legacy format (list only) and new format (list/groups).
 */
export const restore = (
  brotli: BrotliInstance,
  data: string
): CompressionRestoration => {
  // Un URI-encode the data
  data = decodeURIComponent(data.replace("?p=", ""));
  console.debug("Going to decompress", data);

  // Decode the brotli-compressed string
  const compressedBuffer = Buffer.from(data, "base64");
  const decompressedBuffer = brotli.decompress(compressedBuffer);
  const utf8Decoder = new TextDecoder();
  const jsonString = utf8Decoder.decode(decompressedBuffer);

  // Parse the JSON
  const payload = JSON.parse(jsonString) as CompressedPayload | LegacyPayload;

  // Check if this is the new format or legacy format
  const isNewFormat = "mode" in payload;

  // Reconstruct CandidateItems
  const candidates: CandidateItem[] = payload.c.map((text) => ({
    uuid: crypto.randomUUID(),
    text: text,
  }));

  // Restores the groups mode data
  if (isNewFormat && (payload as CompressedPayload).mode === PickrMode.Groups) {
    const groupsPayload = payload as CompressedPayload;

    // Reconstruct groups
    const groups = (groupsPayload.g || []).map(name=> ({
      uuid: crypto.randomUUID(),
      name: name,
    }));

    return {
      mode: PickrMode.Groups,
      targetDatetime: payload.t,
      candidates,
      groups,
      config: {
        maxPerGroup: groupsPayload.m ?? null,
      },
    };
  }

  // Default to list mode (also handles legacy format)
  return {
    mode: PickrMode.List,
    targetDatetime: payload.t,
    candidates,
    config: {
      numberOfWinners: 1
    }
  };
};

/**
 * Compress the list mode state into a base64-encoded Brotli-compressed JSON string.
 */
export const compressList = (
  brotli: BrotliInstance,
  targetTime: Date,
  candidates: CandidateItem[]
): string => {
  const payload: CompressedPayload = {
    mode: "list",
    t: targetTime.toISOString(),
    c: candidates.map((c) => c.text),
  };

  return compressPayload(brotli, payload);
};

/**
 * Compress the groups mode state into a base64-encoded Brotli-compressed JSON string.
 */
export const compressGroups = (
  brotli: BrotliInstance,
  targetTime: Date,
  candidates: CandidateItem[],
  groups: Array<{ name: string }>,
  config: GroupsConfig
): string => {
  const payload: CompressedPayload = {
    mode: "groups",
    t: targetTime.toISOString(),
    c: candidates.map((c) => c.text),
    g: groups.map((g) => g.name),
    m: config.maxPerGroup,
  };

  return compressPayload(brotli, payload);
};

/**
 * Internal helper to compress any payload
 */
const compressPayload = (
  brotli: BrotliInstance,
  payload: CompressedPayload
): string => {
  const jsonString = JSON.stringify(payload);
  const compressedBuffer = brotli.compress(Buffer.from(jsonString), {
    quality: 20,
  });
  const base64Encoded = Buffer.from(compressedBuffer).toString("base64");

  console.debug(
    `Compressed Data (original: ${jsonString.length}) (compressed: ${base64Encoded.length})`
  );

  return base64Encoded;
};