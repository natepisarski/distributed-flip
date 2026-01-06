import React from "react";
import { TabMode } from "../../types";

interface TabButtonProps {
    label: string;
    tabKey: TabMode;
    activeTab: TabMode;
    onClick: (tab: TabMode) => void;
    disabled?: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({
    label,
    tabKey,
    activeTab,
    onClick,
    disabled = false,
}) => {
    const isActive = activeTab === tabKey;

    const baseClasses =
        "px-6 py-3 text-lg font-semibold transition-all duration-200 border-b-2 focus:outline-none";

    const activeClasses = isActive
        ? "text-blue-400 border-blue-400 bg-gray-800/50"
        : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600";

    const disabledClasses = disabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer";

    return (
        <button
            className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
            onClick={() => !disabled && onClick(tabKey)}
            disabled={disabled}
            role="tab"
            aria-selected={isActive}
        >
            {label}
        </button>
    );
};
