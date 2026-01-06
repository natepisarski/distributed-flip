import React from "react";
import { GroupAssignment } from "../../types";

interface GroupResultsProps {
    assignments: GroupAssignment[];
}

// Color palette for groups (cycles if more than available colors)
const GROUP_COLORS = [
    "bg-blue-900/30 border-blue-600",
    "bg-green-900/30 border-green-600",
    "bg-purple-900/30 border-purple-600",
    "bg-orange-900/30 border-orange-600",
    "bg-pink-900/30 border-pink-600",
    "bg-cyan-900/30 border-cyan-600",
    "bg-yellow-900/30 border-yellow-600",
    "bg-red-900/30 border-red-600",
    "bg-indigo-900/30 border-indigo-600",
    "bg-teal-900/30 border-teal-600",
];

/**
 * Displays the distribution results - each group with assigned candidates
 */
export const GroupResults: React.FC<GroupResultsProps> = ({ assignments }) => {
    if (assignments.length === 0) {
        return (
            <div className="text-gray-500 italic text-center py-4">
                No results yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment, index) => {
                const colorClass = GROUP_COLORS[index % GROUP_COLORS.length];

                return (
                    <div
                        key={assignment.group.uuid}
                        className={`${colorClass} border rounded-lg p-3 transition-all duration-300`}
                    >
                        {/* Group header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                            <h3 className="text-white font-bold">{assignment.group.name}</h3>
                            <span className="text-gray-400 text-sm">
                                {assignment.candidates.length} member
                                {assignment.candidates.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Candidates list */}
                        {assignment.candidates.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No members</p>
                        ) : (
                            <ul className="space-y-1">
                                {assignment.candidates.map((candidate) => (
                                    <li
                                        key={candidate.uuid}
                                        className="text-gray-300 text-sm font-mono pl-2 flex items-center"
                                    >
                                        <span className="text-gray-500 mr-2">•</span>
                                        {candidate.text}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
