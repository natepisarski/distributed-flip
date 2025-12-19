import React, { useEffect } from 'react';
import { CandidateItem } from "../App";

interface ListProps {
    candidates: CandidateItem[];
    listEndRef: React.RefObject<HTMLDivElement|null>;
    onRemove: (uuid: string) => void;
    winnerUuid: string | null;
    readonly: boolean;
}

export const List = ({ candidates, listEndRef, onRemove, winnerUuid, readonly }: ListProps) => {

    // Auto-scroll to the winner when revealed
    useEffect(() => {
        if (winnerUuid && listEndRef.current) {
            const winnerEl = document.getElementById(`candidate-${winnerUuid}`);
            winnerEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [listEndRef, winnerUuid]);

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto shadow-xl">
            {candidates.length === 0 ? (
                <p className="text-gray-500 italic">No items yet</p>
            ) : (
                <ul className="space-y-2">
                    {candidates.map((option: CandidateItem) => {
                        const isWinner = winnerUuid === option.uuid;
                        const opacityClass = (winnerUuid && !isWinner) ? 'opacity-30' : 'opacity-100';
                        const winnerClass = isWinner ? 'bg-green-900/30 border-green-500 text-green-300 font-bold' : 'border-b border-gray-700/50 text-gray-300';

                        return (
                            <li
                                key={option.uuid}
                                id={`candidate-${option.uuid}`}
                                className={`font-mono text-sm p-2 rounded transition-all duration-500 ${winnerClass} ${opacityClass} flex flex-row items-center`}
                            >
                                {/* Only show delete button if no winner is chosen yet */}
                                {!readonly && (
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