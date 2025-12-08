import React, {useRef} from "react";
import {CandidateItem} from "../App";

export interface ListProps {
    candidates: CandidateItem[];
    listEndRef: React.Ref<HTMLDivElement>;
    onRemove: (uuid: string) => void;
}

export const List = ({candidates, listEndRef, onRemove}: ListProps) => {
    return <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto shadow-xl">
        {candidates.length === 0 ? (
            <p className="text-gray-500 italic">No activity yet.</p>
        ) : (
            <ul className="space-y-2">
                {candidates.map((option : CandidateItem) => (
                    <li key={option.uuid}
                        className="text-gray-300 font-mono text-sm border-b border-gray-700/50 pb-1 last:border-0">
                        <span className="text-red-500 mr-2 cursor-pointer hover:underline" onClick={() => onRemove(option.uuid)}>❌</span>
                        {option.text}
                    </li>
                ))}
                {/* Invisible element to anchor scroll to bottom */}
                <div ref={listEndRef}/>
            </ul>
        )}
    </div>;
}