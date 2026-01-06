import { useState, useEffect, useCallback } from "react";
import {
    fetchBeaconByTime,
    HttpCachingChain,
    HttpChainClient,
} from "drand-client";

interface UseDrandRandomizerOptions {
    targetDatetime: string;
    itemCount: number;
    isActive: boolean;
}

interface UseDrandRandomizerResult {
    // The winning index (for list mode - single selection)
    winnerIndex: number | null;
    // Shuffled indices (for groups mode - distribution)
    shuffledIndices: number[] | null;
    // Raw randomness value for custom processing
    randomness: bigint | null;
    // Loading state
    isLoading: boolean;
    // Error if any
    error: Error | null;
}

/**
 * Hook that fetches randomness from drand and provides both single-winner selection
 * and shuffled ordering for group distribution.
 */
export const useDrandRandomizer = ({
    targetDatetime,
    itemCount,
    isActive,
}: UseDrandRandomizerOptions): UseDrandRandomizerResult => {
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
    const [shuffledIndices, setShuffledIndices] = useState<number[] | null>(null);
    const [randomness, setRandomness] = useState<bigint | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Fisher-Yates shuffle using drand randomness as seed.
     * Creates deterministic shuffle from the randomness value.
     */
    const shuffleWithRandomness = useCallback(
        (count: number, randomnessVal: bigint): number[] => {
            const indices = Array.from({ length: count }, (_, i) => i);

            // Use the randomness to seed a deterministic shuffle
            // We'll use different "slices" of the randomness for each swap
            let currentRandomness = randomnessVal;

            for (let i = count - 1; i > 0; i--) {
                // Get a random index from 0 to i
                const j = Number(currentRandomness % BigInt(i + 1));
                // Swap
                [indices[i], indices[j]] = [indices[j], indices[i]];
                // Advance the randomness (simple hash-like operation)
                currentRandomness = currentRandomness / BigInt(i + 1);
                // If we run out of bits, rehash
                if (currentRandomness === BigInt(0)) {
                    currentRandomness = randomnessVal ^ BigInt(i);
                }
            }

            return indices;
        },
        []
    );

    useEffect(() => {
        // Reset state when inputs change
        if (!isActive || itemCount === 0) {
            return;
        }

        const checkTimeAndFetch = async () => {
            const now = Date.now();
            const target = new Date(targetDatetime).getTime();

            // Only fetch if the time has passed
            if (now < target) {
                return;
            }

            // Already have result
            if (winnerIndex !== null) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const options = {
                    disableBeaconVerification: true,
                    noCache: false,
                };

                const chain = new HttpCachingChain("https://api.drand.sh", options);
                const client = new HttpChainClient(chain, options);

                const theBeacon = await fetchBeaconByTime(client, target);
                const randomnessVal = BigInt(`0x${theBeacon.randomness}`);

                setRandomness(randomnessVal);

                // Calculate winner index (for list mode)
                const winner = Number(randomnessVal % BigInt(itemCount));
                setWinnerIndex(winner);

                // Calculate shuffled indices (for groups mode)
                const shuffled = shuffleWithRandomness(itemCount, randomnessVal);
                setShuffledIndices(shuffled);
            } catch (e) {
                console.error("Failed to fetch drand beacon:", e);
                setError(e instanceof Error ? e : new Error("Unknown error"));
            } finally {
                setIsLoading(false);
            }
        };

        // Run immediately
        checkTimeAndFetch();

        // Poll every 10 seconds
        const intervalId = setInterval(checkTimeAndFetch, 10000);

        return () => clearInterval(intervalId);
    }, [
        targetDatetime,
        itemCount,
        isActive,
        winnerIndex,
        shuffleWithRandomness,
    ]);

    // Reset when target datetime changes
    useEffect(() => {
        setWinnerIndex(null);
        setShuffledIndices(null);
        setRandomness(null);
        setError(null);
    }, [targetDatetime]);

    return {
        winnerIndex,
        shuffledIndices,
        randomness,
        isLoading,
        error,
    };
};
