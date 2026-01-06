import React, { useRef, useEffect, useState } from "react";
import {
    CandidateItem,
    GroupItem,
    GroupsConfig,
    GroupAssignment,
    MAX_GROUP_CANDIDATES,
} from "../../types";
import { CandidateList } from "../shared/CandidateList";
import { CandidateInput } from "../shared/CandidateInput";
import { DateTimePicker } from "../shared/DateTimePicker";
import { GroupEditor } from "./GroupEditor";
import { GroupConfig } from "./GroupConfig";
import { GroupResults } from "./GroupResults";
import { useDrandRandomizer } from "../../hooks/useDrandRandomizer";
import {
    distributeToGroups,
    validateGroupConfig,
} from "../../business/group-distribution";

interface GroupsTabProps {
    candidates: CandidateItem[];
    setCandidates: React.Dispatch<React.SetStateAction<CandidateItem[]>>;
    groups: GroupItem[];
    setGroups: React.Dispatch<React.SetStateAction<GroupItem[]>>;
    config: GroupsConfig;
    setConfig: React.Dispatch<React.SetStateAction<GroupsConfig>>;
    targetUtcDatetime: string;
    setTargetUtcDatetime: (datetime: string) => void;
    readonly: boolean;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
    candidates,
    setCandidates,
    groups,
    setGroups,
    config,
    setConfig,
    targetUtcDatetime,
    setTargetUtcDatetime,
    readonly,
}) => {
    const listEndRef = useRef<HTMLDivElement>(null);
    const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
    const [hasResult, setHasResult] = useState(false);

    // Validation
    const validationError = validateGroupConfig(
        groups.length,
        candidates.length,
        config.maxPerGroup
    );
    const isValid = validationError === null;

    // Use drand randomizer hook
    const { shuffledIndices, isLoading } = useDrandRandomizer({
        targetDatetime: targetUtcDatetime,
        itemCount: candidates.length,
        isActive: readonly && !hasResult && isValid,
    });

    // Calculate assignments when we get shuffled indices
    useEffect(() => {
        if (shuffledIndices && groups.length > 0 && candidates.length > 0) {
            const newAssignments = distributeToGroups(
                candidates,
                groups,
                shuffledIndices,
                config
            );
            setAssignments(newAssignments);
            setHasResult(true);
        }
    }, [shuffledIndices, groups, candidates, config]);

    // Reset result if datetime changes
    useEffect(() => {
        if (!readonly) {
            setAssignments([]);
            setHasResult(false);
        }
    }, [targetUtcDatetime, readonly]);

    // Auto-scroll effect for the candidate list
    useEffect(() => {
        if (!hasResult) {
            listEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [candidates, hasResult]);

    const handleAddCandidate = (text: string) => {
        setCandidates([
            ...candidates,
            {
                uuid: crypto.randomUUID(),
                text,
            },
        ]);
    };

    const handleRemoveCandidate = (uuid: string) => {
        setCandidates(candidates.filter((c) => c.uuid !== uuid));
    };

    const handleDatetimeChange = (datetime: string) => {
        setTargetUtcDatetime(datetime);
        setAssignments([]);
        setHasResult(false);
    };

    // Show results view when we have assignments
    if (hasResult && assignments.length > 0) {
        return (
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col items-center">
                    <p className="text-white font-bold text-xl">Groups Assigned</p>
                    <DateTimePicker
                        targetUtcDatetime={targetUtcDatetime}
                        onDatetimeChange={handleDatetimeChange}
                        readonly={true}
                        hasResult={true}
                    />
                </div>

                {/* Results */}
                <GroupResults assignments={assignments} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header with subtitle and date picker */}
            <div className="flex flex-col items-center">
                <p className="text-white font-bold text-xl">Group Distribution</p>
                <DateTimePicker
                    targetUtcDatetime={targetUtcDatetime}
                    onDatetimeChange={handleDatetimeChange}
                    readonly={readonly}
                    hasResult={false}
                />
            </div>

            {/* Two column layout for groups and candidates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Groups column */}
                <div className="flex flex-col gap-4">
                    <GroupEditor
                        groups={groups}
                        setGroups={setGroups}
                        readonly={readonly}
                    />
                    <GroupConfig
                        config={config}
                        setConfig={setConfig}
                        numGroups={groups.length}
                        numCandidates={candidates.length}
                        readonly={readonly}
                    />
                </div>

                {/* Candidates column */}
                <div className="flex flex-col gap-4">
                    <label className="text-white font-semibold">
                        Candidates ({candidates.length} / {MAX_GROUP_CANDIDATES})
                    </label>
                    <CandidateList
                        candidates={candidates}
                        listEndRef={listEndRef}
                        onRemove={readonly ? undefined : handleRemoveCandidate}
                        readonly={readonly}
                        highlightMode="none"
                    />
                    {!readonly && (
                        <CandidateInput
                            onAddCandidate={handleAddCandidate}
                            currentCount={candidates.length}
                            maxCount={MAX_GROUP_CANDIDATES}
                            placeholder={`Add candidate (${candidates.length} / ${MAX_GROUP_CANDIDATES})`}
                        />
                    )}
                </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="text-blue-400 text-center animate-pulse">
                    Contacting the League of Entropy...
                </div>
            )}

            {/* Waiting message when readonly but no result yet */}
            {readonly && !hasResult && !isLoading && isValid && (
                <div className="text-yellow-400 text-center animate-pulse">
                    Waiting for target time to assign groups...
                </div>
            )}
        </div>
    );
};
