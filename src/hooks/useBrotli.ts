import { useState, useEffect } from "react";
import brotliPromise from "brotli-wasm";
import { BrotliInstance } from "../types";

/**
 * Hook to load and provide the Brotli compression instance
 */
export const useBrotli = (): BrotliInstance | null => {
    const [brotli, setBrotli] = useState<BrotliInstance | null>(null);

    useEffect(() => {
        const loadBrotli = async () => {
            const instance = await brotliPromise;
            setBrotli(instance);
        };

        loadBrotli();
    }, []);

    return brotli;
};
