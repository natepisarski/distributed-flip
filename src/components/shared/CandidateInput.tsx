import React, { useState } from "react";

interface CandidateInputProps {
    onAddCandidate: (text: string) => void;
    currentCount: number;
    maxCount: number;
    disabled?: boolean;
    placeholder?: string;
}

/**
 * Shared input component for adding candidates
 */
export const CandidateInput: React.FC<CandidateInputProps> = ({
    onAddCandidate,
    currentCount,
    maxCount,
    disabled = false,
    placeholder,
}) => {
    const [inputValue, setInputValue] = useState("");

    const atMaxCandidates = currentCount >= maxCount;
    const isDisabled = disabled || atMaxCandidates;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            onAddCandidate(inputValue.trim());
            setInputValue("");
        }
    };

    const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "";
    const defaultPlaceholder = `Add Item (${currentCount} / ${maxCount})`;

    return (
        <div className="relative">
            <input
                type="text"
                className={`w-full bg-gray-800 text-white text-xl p-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all ${disabledClasses}`}
                placeholder={placeholder || defaultPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={isDisabled}
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm hidden sm:block">
                Press Enter ↵
            </div>
        </div>
    );
};
