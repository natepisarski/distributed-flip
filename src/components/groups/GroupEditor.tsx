import React, { useState } from "react";
import { GroupItem, MAX_GROUPS } from "../../types";

interface GroupEditorProps {
    groups: GroupItem[];
    setGroups: React.Dispatch<React.SetStateAction<GroupItem[]>>;
    readonly: boolean;
}

/**
 * Component for managing group definitions (add/remove/edit)
 */
export const GroupEditor: React.FC<GroupEditorProps> = ({
    groups,
    setGroups,
    readonly,
}) => {
    const [inputValue, setInputValue] = useState("");

    const atMaxGroups = groups.length >= MAX_GROUPS;

    const handleAddGroup = () => {
        if (inputValue.trim() && !atMaxGroups) {
            setGroups([
                ...groups,
                {
                    uuid: crypto.randomUUID(),
                    name: inputValue.trim(),
                },
            ]);
            setInputValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleAddGroup();
        }
    };

    const handleRemoveGroup = (uuid: string) => {
        setGroups(groups.filter((g) => g.uuid !== uuid));
    };

    const disabledClasses = atMaxGroups ? "opacity-50 cursor-not-allowed" : "";

    return (
        <div className="flex flex-col gap-3">
            <label className="text-white font-semibold">
                Groups ({groups.length} / {MAX_GROUPS})
            </label>

            {/* Group list */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                {groups.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No groups defined</p>
                ) : (
                    <ul className="space-y-1">
                        {groups.map((group, index) => (
                            <li
                                key={group.uuid}
                                className="flex items-center justify-between text-gray-300 text-sm p-1 rounded bg-gray-700/50"
                            >
                                <span className="flex items-center">
                                    <span className="text-blue-400 mr-2">{index + 1}.</span>
                                    {group.name}
                                </span>
                                {!readonly && (
                                    <button
                                        className="text-red-500 hover:text-red-400 text-xs px-2"
                                        onClick={() => handleRemoveGroup(group.uuid)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Add group input */}
            {!readonly && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        className={`flex-grow bg-gray-800 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabledClasses}`}
                        placeholder="Add group name..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={atMaxGroups}
                    />
                    <button
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${disabledClasses}`}
                        onClick={handleAddGroup}
                        disabled={atMaxGroups || !inputValue.trim()}
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );
};
