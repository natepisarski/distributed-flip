import React, { useEffect } from "react";
import { CandidateItem } from "../../types";

interface CandidateListProps {
  candidates: CandidateItem[];
  listEndRef: React.RefObject<HTMLDivElement | null>;
  onRemove?: (uuid: string) => void;
  winnerUuid?: string | null;
  readonly: boolean;
  // Optional: highlight mode for groups (shows all items equally)
  highlightMode?: "winner" | "none";
}

/**
 * Shared candidate list component used by both List and Groups tabs
 */
export const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  listEndRef,
  onRemove,
  winnerUuid,
  readonly,
  highlightMode = "winner",
}) => {
  // Auto-scroll to the winner when revealed
  useEffect(() => {
    if (winnerUuid && listEndRef.current) {
      const winnerEl = document.getElementById(`candidate-${winnerUuid}`);
      winnerEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [listEndRef, winnerUuid]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto shadow-xl">
      {candidates.length === 0 ? (
        <p className="text-gray-500 italic">No items yet</p>
      ) : (
        <ul className="space-y-2">
          {candidates.map((option: CandidateItem) => {
            const isWinner =
              highlightMode === "winner" && winnerUuid === option.uuid;
            const opacityClass =
              highlightMode === "winner" && winnerUuid && !isWinner
                ? "opacity-30"
                : "opacity-100";
            const winnerClass = isWinner
              ? "bg-green-900/30 border-green-500 text-green-300 font-bold"
              : "border-b border-gray-700/50 text-gray-300";

            return (
              <li
                key={option.uuid}
                id={`candidate-${option.uuid}`}
                className={`font-mono text-sm p-2 rounded transition-all duration-500 ${winnerClass} ${opacityClass} flex flex-row items-center`}
              >
                {/* Only show delete button if not readonly and onRemove provided */}
                {!readonly && onRemove && (
                  <span
                    className="text-red-500 mr-2 cursor-pointer hover:underline"
                    onClick={() => onRemove(option.uuid)}
                  >
                    ❌
                  </span>
                )}

                {isWinner && <span className="mr-2">👑</span>}
                {option.text}
              </li>
            );
          })}
          {/* Invisible element to anchor scroll to bottom */}
          <div ref={listEndRef} />
        </ul>
      )}
    </div>
  );
};
