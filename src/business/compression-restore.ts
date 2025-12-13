import {BrotliInstance, CandidateItem} from "../App";

/**
 * Given the compressed data string, we restore the original list of CandidateItems. The data string is a base64-encoded
 * Brotli-compressed JSON object with the following format:
 * {
 *     t: <target_datetime_utc_iso_8601_string>,
 *     c: [<candidate_1_string>, <candidate_2_string>, etc.]
 * }
 * @param brotli
 * @param data
 */
export const restore = (brotli: BrotliInstance, data: string, ): Array<CandidateItem> => {
    // Decode the brotli-compressed string
    const compressedBuffer = Buffer.from(data, 'base64');
    const decompressedBuffer = brotli.decompress(compressedBuffer);
    const utf8Decoder = new TextDecoder();
    const jsonString = utf8Decoder.decode(decompressedBuffer);

    // Parse the JSON
    const payload = JSON.parse(jsonString) as { t: string; c: Array<string> };

    // Reconstruct CandidateItems
    const candidates: Array<CandidateItem> = payload.c.map(text => ({
        uuid: crypto.randomUUID(),
        text: text
    }));

    return candidates;
}

/**
 * Compress the target time and candidates into a base64-encoded Brotli-compressed JSON string.
 * @param brotli
 * @param targetTime
 * @param candidates
 */
export const compress = (brotli: BrotliInstance, targetTime: Date, candidates: Array<CandidateItem>): string => {
    const candidateArray = candidates.map(c => c.text);
    const payload = {
        t: targetTime.toISOString(),
        c: candidateArray
    }
    const jsonString = JSON.stringify(payload);
    const compressedBuffer = brotli.compress(Buffer.from(jsonString), {quality: 20});
    const base64Encoded = Buffer.from(compressedBuffer).toString('base64');

    console.debug(`Compressed Data (original: ${jsonString.length}) (compressed: ${base64Encoded.length})`);

    return base64Encoded;
}