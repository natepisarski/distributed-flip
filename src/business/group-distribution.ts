import { CandidateItem, GroupItem, GroupAssignment, GroupsConfig } from "../types";

/**
 * Validates that the max-per-group constraint is satisfiable.
 * Returns null if valid, or an error message if invalid.
 */
export const validateGroupConfig = (
    numGroups: number,
    numCandidates: number,
    maxPerGroup: number | null
): string | null => {
    if (numGroups === 0) {
        return "At least one group is required";
    }

    if (numCandidates === 0) {
        return "At least one candidate is required";
    }

    if (maxPerGroup !== null && maxPerGroup <= 0) {
        return "Max per group must be a positive number";
    }

    if (maxPerGroup !== null && maxPerGroup * numGroups < numCandidates) {
        const minimumCandidates = maxPerGroup * numGroups;

        return `At least ${minimumCandidates} candidates required when max per group is set to ${maxPerGroup} with ${numGroups} groups.`;
    }

    return null;
};

/**
 * Distributes candidates into groups based on a shuffled order.
 * 
 * @param candidates - All candidates to distribute
 * @param groups - All groups to distribute into
 * @param shuffledIndices - Randomized order of candidate indices
 * @param config - Configuration including max per group
 * @returns Array of group assignments with candidates
 */
export const distributeToGroups = (
    candidates: CandidateItem[],
    groups: GroupItem[],
    shuffledIndices: number[],
    config: GroupsConfig
): GroupAssignment[] => {
    const { maxPerGroup } = config;

    // Initialize empty assignments for each group
    const assignments: GroupAssignment[] = groups.map((group) => ({
        group,
        candidates: [],
    }));

    if (candidates.length === 0 || groups.length === 0) {
        return assignments;
    }

    // Get candidates in shuffled order
    const shuffledCandidates = shuffledIndices.map((i) => candidates[i]);

    // Distribute candidates round-robin style, respecting maxPerGroup if set
    let groupIndex = 0;
    let groupCounts = new Array(groups.length).fill(0);

    for (const candidate of shuffledCandidates) {
        // Find the next group that can accept a candidate
        let attempts = 0;
        while (attempts < groups.length) {
            const currentIndex = (groupIndex + attempts) % groups.length;
            const canAdd =
                maxPerGroup === null || groupCounts[currentIndex] < maxPerGroup;

            if (canAdd) {
                assignments[currentIndex].candidates.push(candidate);
                groupCounts[currentIndex]++;
                groupIndex = (currentIndex + 1) % groups.length;
                break;
            }
            attempts++;
        }
    }

    return assignments;
};
