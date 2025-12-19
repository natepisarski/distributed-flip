import { BrotliInstance, CandidateItem } from "../App";
import { compress } from "../business/compression-restore";
import React, { useState } from "react";

interface ShareLinkProps {
  candidates: CandidateItem[];
  targetDatetime: Date;
  brotli: BrotliInstance;
  enableCompetition: () => void | null;
}

/**
 * Component that just continuously shows the shareable link with a "Copy to Clipboard" button
 * @param brotli
 * @param candidates
 * @param targetDatetime
 * @param enableCompetition Enables the competition. This should set the p queryString
 * @constructor
 */
export const ShareLink = ({
  brotli,
  candidates,
  targetDatetime,
  enableCompetition,
}: ShareLinkProps) => {
  const compressedParams = compress(brotli, targetDatetime, candidates);
  const queryString = `?p=${encodeURIComponent(compressedParams)}`;

  const linkText = `${window.location.origin}/${queryString}`;

  const [copied, setCopied] = useState(false);

  const onCopyClick = () => {
    console.debug(`Copied to Clipboard: ${linkText}`);

    navigator.clipboard.writeText(linkText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // By clicking on the Share link, you are also signaling your intent to finish the list; so we allow the competition to start now
  };

  const copiedClasses = ` w-32 px-4 py-2 rounded-lg transition-colors ${copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`;
  const copiedEmoji = copied ? "✔️" : "📋";
  const copiedText = copied ? "Copied!" : "Copy";

  return (
    <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
      <p className="text-white mb-2 font-bold">Shareable Link</p>

      <div className="flex flex-row w-full items-center gap-4">
        {/* Input grows to fill available space */}
        <input
          type="text"
          readOnly
          value={linkText}
          className="flex-grow bg-gray-900 text-white p-2 rounded-lg font-mono text-sm"
          onFocus={(e) => e.target.select()}
        />

        {/* Button sits naturally on the right */}
        <button className={copiedClasses} onClick={onCopyClick}>
          <div className={"flex flex-row"}>
            <div className={"flex flex-col"}>{copiedEmoji}</div>
            <div className={"flex flex-col justify-center w-full"}>
              {copiedText}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
