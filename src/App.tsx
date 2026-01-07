import React, { useState, useEffect } from "react";
import "./App.css";
import {
  TabMode,
  CandidateItem,
  GroupItem,
  GroupsConfig,
  AmountConfig,
  DEFAULT_AMOUNT_MIN,
  DEFAULT_AMOUNT_MAX,
} from "./types";
import { useBrotli } from "./hooks/useBrotli";
import { restore } from "./business/compression-restore";
import { ShareLink } from "./components/ShareLink";
import { TabContainer } from "./components/tabs/TabContainer";
import { ListTab } from "./components/list/ListTab";
import { GroupsTab } from "./components/groups/GroupsTab";
import { AmountTab } from "./components/amount/AmountTab";

const getModeEmoji = (
  readonly: boolean,
  hasResult: boolean,
  mode: TabMode,
): string => {
  if (readonly) {
    if (hasResult) {
      if (mode === "list") return "🏅";
      if (mode === "groups") return "👥";
      if (mode === "amount") return "🔢";
    }
    return "⏳";
  }
  return "📝";
};

const App = () => {
  // Load Brotli compression
  const brotli = useBrotli();

  // Check for compressed URL parameter
  const compressedParam = new URLSearchParams(window.location.search).get("p");
  const isParameterPresent = compressedParam !== null;

  // Core state
  const [activeTab, setActiveTab] = useState<TabMode>("list");
  const [isReadonly, setIsReadonly] = useState<boolean>(isParameterPresent);

  // Target datetime (shared between tabs)
  const defaultTargetUtcDatetime = new Date(Date.now() + 60 * 60 * 1000);
  const [targetUtcDatetime, setTargetUtcDatetime] = useState<string>(
    defaultTargetUtcDatetime.toISOString(),
  );

  // List tab state
  const [listCandidates, setListCandidates] = useState<CandidateItem[]>([
    { uuid: crypto.randomUUID(), text: "Heads" },
    { uuid: crypto.randomUUID(), text: "Tails" },
  ]);
  const [winnerUuid, setWinnerUuid] = useState<string | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState<boolean>(false);

  // Groups tab state
  const [groupsCandidates, setGroupsCandidates] = useState<CandidateItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupsConfig, setGroupsConfig] = useState<GroupsConfig>({
    maxPerGroup: null,
  });

  // Amount tab state
  const [amountConfig, setAmountConfig] = useState<AmountConfig>({
    min: DEFAULT_AMOUNT_MIN,
    max: DEFAULT_AMOUNT_MAX,
  });

  // Restore state from URL
  useEffect(() => {
    if (brotli && compressedParam) {
      const restoration = restore(brotli, window.location.search);

      setTargetUtcDatetime(restoration.targetDatetime);
      setActiveTab(restoration.mode);

      if (restoration.mode === "list") {
        setListCandidates(restoration.candidates);
        setWinnerUuid(null);
      } else if (restoration.mode === "groups") {
        setGroupsCandidates(restoration.candidates);
        setGroups(restoration.groups);
        setGroupsConfig(restoration.config);
      } else if (restoration.mode === "amount") {
        setAmountConfig(restoration.config);
      }
    }
  }, [brotli, compressedParam]);

  // Loading state
  if (!brotli) {
    return (
      <div className="min-h-screen w-full bg-gray-900 flex justify-center items-center">
        <div className="text-white text-xl">Loading compression module...</div>
      </div>
    );
  }

  // Determine display mode
  const hasListResult = !!winnerUuid;
  const hasGroupsResult = false; // Will be determined by GroupsTab internally
  const hasAmountResult = false; // Will be determined by AmountTab internally
  const hasResult =
    activeTab === "list"
      ? hasListResult
      : activeTab === "groups"
        ? hasGroupsResult
        : hasAmountResult;
  const modeEmoji = getModeEmoji(isReadonly, hasResult, activeTab);

  // Enable competition mode
  const makeReadonly = () => {
    setIsReadonly(true);
  };

  // Handle tab change (only when not readonly)
  const handleTabChange = (tab: TabMode) => {
    if (!isReadonly) {
      setActiveTab(tab);
      // Reset winner when switching tabs in edit mode
      setWinnerUuid(null);
    }
  };

  // Handle datetime change (resets results)
  const handleDatetimeChange = (datetime: string) => {
    setTargetUtcDatetime(datetime);
    setWinnerUuid(null);
  };

  // Get current candidates for ShareLink
  const currentCandidates =
    activeTab === "list" ? listCandidates : groupsCandidates;

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "list":
        return (
          <ListTab
            candidates={listCandidates}
            setCandidates={setListCandidates}
            targetUtcDatetime={targetUtcDatetime}
            setTargetUtcDatetime={handleDatetimeChange}
            readonly={isReadonly}
            isLoadingResult={isLoadingResult}
            setIsLoadingResult={setIsLoadingResult}
            winnerUuid={winnerUuid}
            setWinnerUuid={setWinnerUuid}
          />
        );
      case "groups":
        return (
          <GroupsTab
            candidates={groupsCandidates}
            setCandidates={setGroupsCandidates}
            groups={groups}
            setGroups={setGroups}
            config={groupsConfig}
            setConfig={setGroupsConfig}
            targetUtcDatetime={targetUtcDatetime}
            setTargetUtcDatetime={handleDatetimeChange}
            readonly={isReadonly}
          />
        );
      case "amount":
        return (
          <AmountTab
            config={amountConfig}
            setConfig={setAmountConfig}
            targetUtcDatetime={targetUtcDatetime}
            setTargetUtcDatetime={handleDatetimeChange}
            readonly={isReadonly}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-6xl flex flex-col gap-2">
        {/* Header */}
        <div className="flex flex-row w-full items-center justify-center">
          <a href="/">
            <h1 className="text-4xl font-bold text-white text-center tracking-wider cursor-pointer hover:underline hover:text-blue-400">
              {modeEmoji} Pickr
            </h1>
          </a>
        </div>

        {/* Tab Container */}
        <TabContainer
          activeTab={activeTab}
          onTabChange={handleTabChange}
          readonly={isReadonly}
        >
          {renderTabContent()}
        </TabContainer>

        {/* Share Link */}
        <ShareLink
          brotli={brotli}
          mode={activeTab}
          candidates={currentCandidates}
          targetDatetime={new Date(targetUtcDatetime)}
          enableCompetition={makeReadonly}
          groups={groups}
          groupsConfig={groupsConfig}
          amountConfig={amountConfig}
          readonly={isReadonly}
        />
      </div>
    </div>
  );
};

export default App;
