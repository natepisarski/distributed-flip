import React, { useState } from "react";
import { GroupsConfig } from "../../types";
import { validateGroupConfig } from "../../business/group-distribution";

interface GroupConfigProps {
    config: GroupsConfig;
    setConfig: React.Dispatch<React.SetStateAction<GroupsConfig>>;
    numGroups: number;
    numCandidates: number;
    readonly: boolean;
}

/**
 * Configuration panel for group settings (max per group, etc.)
 * Hidden behind an "Advanced" toggle to reduce visual noise.
 */
export const GroupConfig: React.FC<GroupConfigProps> = ({
    config,
    setConfig,
    numGroups,
    numCandidates,
    readonly,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const validationError = validateGroupConfig(
        numGroups,
        numCandidates,
        config.maxPerGroup
    );

    const handleMaxPerGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setConfig({ ...config, maxPerGroup: null });
        } else {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0) {
                setConfig({ ...config, maxPerGroup: numValue });
            }
        }
    };

    const handleClearMaxPerGroup = () => {
        setConfig({ ...config, maxPerGroup: null });
    };

    // Show if config is set or there's a validation error
    const hasActiveConfig = config.maxPerGroup !== null;

    return (
        <div className="flex flex-col gap-2">
            {/* Toggle button */}
            <button
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span
                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                >
                    ▶
                </span>
                <span>Advanced</span>
                {hasActiveConfig && !isExpanded && (
                    <span className="text-blue-400 text-xs ml-2">
                        (max {config.maxPerGroup}/group)
                    </span>
                )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 ml-4">
                    {/* Max per group input */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-gray-300 text-sm flex-shrink-0">
                            Max per group:
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="w-20 bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm"
                            value={config.maxPerGroup ?? ""}
                            onChange={handleMaxPerGroupChange}
                            placeholder="None"
                            disabled={readonly}
                        />
                        {config.maxPerGroup !== null && !readonly && (
                            <button
                                className="text-gray-400 hover:text-white text-xs"
                                onClick={handleClearMaxPerGroup}
                            >
                                Clear
                            </button>
                        )}
                        <span className="text-gray-500 text-xs">
                            (Leave empty for no limit)
                        </span>
                    </div>

                    {/* Validation error */}
                    {validationError && (
                        <div className="mt-2 text-red-400 text-xs bg-red-900/20 border border-red-800 rounded p-2">
                            ⚠️ {validationError}
                        </div>
                    )}
                </div>
            )}

            {/* Summary always visible when valid */}
            {!validationError && numGroups > 0 && numCandidates > 0 && (
                <div className="text-green-400 text-sm ml-4">
                    ✓ {numCandidates} candidates → {numGroups} groups
                    {config.maxPerGroup ? ` (max ${config.maxPerGroup} each)` : ""}
                </div>
            )}

            {/* Show validation error even when collapsed */}
            {validationError && !isExpanded && (
                <div className="text-red-400 text-xs ml-4">⚠️ {validationError}</div>
            )}
        </div>
    );
};
