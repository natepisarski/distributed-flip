import React, { useState } from "react";
import {
  BrotliInstance,
  CandidateItem,
  TabMode,
  GroupItem,
  GroupsConfig,
} from "../types";
import { compressList, compressGroups } from "../business/compression-restore";
import { validateGroupConfig } from "../business/group-distribution";
import {PickrMode} from "../types/enums";

interface ShareLinkProps {
  brotli: BrotliInstance;
  mode: TabMode;
  candidates: CandidateItem[];
  targetDatetime: Date;
  enableCompetition: () => void;
  groups?: GroupItem[];
  groupsConfig?: GroupsConfig;
  readonly?: boolean;
}

/**
 * Component that shows the shareable link with Copy and Go buttons
 */
export const ShareLink: React.FC<ShareLinkProps> = ({
  brotli,
  mode,
  candidates,
  targetDatetime,
  enableCompetition,
  groups = [],
  groupsConfig = { maxPerGroup: null },
  readonly = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Validate for groups mode
  const groupsValidationError =
    mode === PickrMode.Groups
      ? validateGroupConfig(
        groups.length,
        candidates.length,
        groupsConfig.maxPerGroup
      )
      : null;

  const isList = mode === PickrMode.List;
  const isGroups = mode === PickrMode.Groups;

  // Can't share if groups mode has validation errors
  const canShare = isList || groupsValidationError === null;

  // Compress based on mode
  const compressedParams =
    mode === "list"
      ? compressList(brotli, targetDatetime, candidates)
      : compressGroups(brotli, targetDatetime, candidates, groups, groupsConfig);

  const queryString = `?p=${encodeURIComponent(compressedParams)}`;
  const linkText = `${window.location.origin}/${queryString}`;

  // Copy just copies the link - does NOT enter competition mode
  const onCopyClick = () => {
    if (!canShare) return;

    console.debug(`Copied to Clipboard: ${linkText}`);

    navigator.clipboard.writeText(linkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Go button enters competition/readonly mode and updates the URL
  const onGoClick = () => {
    if (!canShare) {
      return;
    }

    window.location.href = linkText;

    enableCompetition();
  };

  const buttonDisabledClasses = !canShare
    ? "opacity-50 cursor-not-allowed bg-gray-600"
    : "";

  const copyClasses = `w-28 px-4 py-2 rounded-lg transition-colors ${copied
      ? "bg-green-600 text-white"
      : canShare
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : buttonDisabledClasses
    }`;

  const goClasses = `w-24 px-4 py-2 rounded-lg transition-colors ${canShare
      ? "bg-green-600 text-white hover:bg-green-700"
      : buttonDisabledClasses
    }`;

  const copiedEmoji = copied ? "✔️" : "📋";
  const copiedText = copied ? "Copied!" : "Copy";

  return (
    <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
      <p className="text-white mb-2 font-bold">Shareable Link</p>

      {/* Validation warning for groups */}
      {groupsValidationError && mode === "groups" && (
        <div className="mb-3 text-yellow-400 text-sm">
          ⚠️ {groupsValidationError} - Fix to enable sharing
        </div>
      )}

      <div className="flex flex-row w-full items-center gap-3">
        {/* Input grows to fill available space */}
        <input
          type="text"
          readOnly
          value={canShare ? linkText : "Fix validation errors to generate link"}
          className={`flex-grow bg-gray-900 text-white p-2 rounded-lg font-mono text-sm ${!canShare ? "opacity-50" : ""
            }`}
          onFocus={(e) => e.target.select()}
        />

        {/* Copy button */}
        <button
          className={copyClasses}
          onClick={onCopyClick}
          disabled={!canShare}
        >
          <div className="flex flex-row items-center justify-center gap-1">
            <span>{copiedEmoji}</span>
            <span>{copiedText}</span>
          </div>
        </button>

        {/* Go button - only show when not already in readonly mode */}
        {!readonly && (
          <button
            className={goClasses}
            onClick={onGoClick}
            disabled={!canShare}
            title="Start the competition and wait for results"
          >
            <div className="flex flex-row items-center justify-center gap-1">
              <span>🚀</span>
              <span>Go!</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
