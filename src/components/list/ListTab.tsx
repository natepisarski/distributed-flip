import React, { useRef, useEffect } from "react";
import { CandidateItem, MAX_LIST_CANDIDATES } from "../../types";
import { CandidateList } from "../shared/CandidateList";
import { CandidateInput } from "../shared/CandidateInput";
import { DateTimePicker } from "../shared/DateTimePicker";
import { useDrandRandomizer } from "../../hooks/useDrandRandomizer";

interface ListTabProps {
    candidates: CandidateItem[];
    setCandidates: React.Dispatch<React.SetStateAction<CandidateItem[]>>;
    targetUtcDatetime: string;
    setTargetUtcDatetime: (datetime: string) => void;
    readonly: boolean;
    isLoadingResult: boolean;
    setIsLoadingResult: (loading: boolean) => void;
    winnerUuid: string | null;
    setWinnerUuid: (uuid: string | null) => void;
}

export const ListTab: React.FC<ListTabProps> = ({
    candidates,
    setCandidates,
    targetUtcDatetime,
    setTargetUtcDatetime,
    readonly,
    isLoadingResult,
    setIsLoadingResult,
    winnerUuid,
    setWinnerUuid,
}) => {
    const listEndRef = useRef<HTMLDivElement>(null);

    // Use drand randomizer hook
    const { winnerIndex, isLoading } = useDrandRandomizer({
        targetDatetime: targetUtcDatetime,
        itemCount: candidates.length,
        isActive: readonly && !winnerUuid,
    });

    // Update loading state
    useEffect(() => {
        setIsLoadingResult(isLoading);
    }, [isLoading, setIsLoadingResult]);

    // Set winner when randomizer returns result
    useEffect(() => {
        if (winnerIndex !== null && candidates[winnerIndex]) {
            setWinnerUuid(candidates[winnerIndex].uuid);
        }
    }, [winnerIndex, candidates, setWinnerUuid]);

    // Auto-scroll effect for the candidate list
    useEffect(() => {
        if (!winnerUuid) {
            listEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [candidates, winnerUuid]);

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
        setWinnerUuid(null);
    };

    const isFullyReadonly = readonly || !!winnerUuid;

    return (
        <div className="flex flex-col gap-4">
            {/* Header with subtitle and date picker */}
            <div className="flex flex-col items-center">
                <p className="text-white font-bold text-xl">
                    {winnerUuid ? "Result Determined" : "List Selector"}
                </p>
                <DateTimePicker
                    targetUtcDatetime={targetUtcDatetime}
                    onDatetimeChange={handleDatetimeChange}
                    readonly={isFullyReadonly}
                    showResultLabel={true}
                    hasResult={!!winnerUuid}
                />
            </div>

            {/* Candidate List */}
            <CandidateList
                candidates={candidates}
                listEndRef={listEndRef}
                onRemove={isFullyReadonly ? undefined : handleRemoveCandidate}
                winnerUuid={winnerUuid}
                readonly={isFullyReadonly}
                highlightMode="winner"
            />

            {/* Input (only when not readonly) */}
            {!isFullyReadonly && (
                <CandidateInput
                    onAddCandidate={handleAddCandidate}
                    currentCount={candidates.length}
                    maxCount={MAX_LIST_CANDIDATES}
                    disabled={!!winnerUuid}
                />
            )}

            {/* Loading indicator */}
            {isLoadingResult && (
                <div className="text-blue-400 text-center animate-pulse">
                    Contacting the League of Entropy...
                </div>
            )}
        </div>
    );
};
