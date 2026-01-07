import React from "react";
import { TabMode } from "../../types";
import { TabButton } from "./TabButton";

interface TabContainerProps {
  activeTab: TabMode;
  onTabChange: (tab: TabMode) => void;
  children: React.ReactNode;
  readonly?: boolean;
}

export const TabContainer: React.FC<TabContainerProps> = ({
  activeTab,
  onTabChange,
  children,
  readonly = false,
}) => {
  return (
    <div className="flex flex-col w-full">
      {/* Tab Bar */}
      <div
        className="flex flex-row border-b border-gray-700 mb-4"
        role="tablist"
      >
        <TabButton
          label="📋 List"
          tabKey="list"
          activeTab={activeTab}
          onClick={onTabChange}
          disabled={readonly}
        />
        <TabButton
          label="👥 Groups"
          tabKey="groups"
          activeTab={activeTab}
          onClick={onTabChange}
          disabled={readonly}
        />
        <TabButton
          label="🔢 Amount"
          tabKey="amount"
          activeTab={activeTab}
          onClick={onTabChange}
          disabled={readonly}
        />
      </div>

      {/* Tab Content */}
      <div role="tabpanel">{children}</div>
    </div>
  );
};
