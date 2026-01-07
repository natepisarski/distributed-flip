import {
  BrotliInstance,
  CandidateItem,
  CompressedPayload,
  GroupsConfig,
  ListConfig,
  AmountConfig,
  DEFAULT_AMOUNT_MIN,
  DEFAULT_AMOUNT_MAX,
} from "../types";
import { PickrMode } from "../types/enums";

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

/**
 * Format for links to Amount mode
 */
export interface AmountRestoration {
  mode: "amount";
  targetDatetime: string;
  config: AmountConfig;
}

export type CompressionRestoration =
  | ListRestoration
  | GroupsRestoration
  | AmountRestoration;

/**
 * Given the compressed data string, we restore the original state.
 * Supports legacy format (list only) and new format (list/groups/amount).
 */
export const restore = (
  brotli: BrotliInstance,
  data: string,
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

  // Restores Amount mode
  if (isNewFormat && (payload as CompressedPayload).mode === PickrMode.Amount) {
    const amountPayload = payload as CompressedPayload;
    return {
      mode: PickrMode.Amount,
      targetDatetime: payload.t,
      config: {
        min: amountPayload.amin ?? DEFAULT_AMOUNT_MIN,
        max: amountPayload.amax ?? DEFAULT_AMOUNT_MAX,
      },
    };
  }

  // Restores the groups mode data
  if (isNewFormat && (payload as CompressedPayload).mode === PickrMode.Groups) {
    const groupsPayload = payload as CompressedPayload;

    // Reconstruct CandidateItems
    const candidates: CandidateItem[] = payload.c.map((text) => ({
      uuid: crypto.randomUUID(),
      text: text,
    }));

    // Reconstruct groups
    const groups = (groupsPayload.g || []).map((name) => ({
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
  // Reconstruct CandidateItems
  const candidates: CandidateItem[] = payload.c.map((text) => ({
    uuid: crypto.randomUUID(),
    text: text,
  }));

  return {
    mode: PickrMode.List,
    targetDatetime: payload.t,
    candidates,
    config: {
      numberOfWinners: 1,
    },
  };
};

/**
 * Compress the list mode state into a base64-encoded Brotli-compressed JSON string.
 */
export const compressList = (
  brotli: BrotliInstance,
  targetTime: Date,
  candidates: CandidateItem[],
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
  config: GroupsConfig,
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
 * Compress the amount mode state into a base64-encoded Brotli-compressed JSON string.
 */
export const compressAmount = (
  brotli: BrotliInstance,
  targetTime: Date,
  config: AmountConfig,
): string => {
  const payload: CompressedPayload = {
    mode: "amount",
    t: targetTime.toISOString(),
    c: [], // No candidates for amount mode
    amin: config.min,
    amax: config.max,
  };

  return compressPayload(brotli, payload);
};

/**
 * Internal helper to compress any payload
 */
const compressPayload = (
  brotli: BrotliInstance,
  payload: CompressedPayload,
): string => {
  const jsonString = JSON.stringify(payload);
  const compressedBuffer = brotli.compress(Buffer.from(jsonString), {
    quality: 20,
  });
  const base64Encoded = Buffer.from(compressedBuffer).toString("base64");

  console.debug(
    `Compressed Data (original: ${jsonString.length}) (compressed: ${base64Encoded.length})`,
  );

  return base64Encoded;
};
