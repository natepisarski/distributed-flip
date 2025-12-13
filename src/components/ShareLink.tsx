import {BrotliInstance, CandidateItem} from "../App";
import {compress} from "../business/compression-restore";

interface ShareLinkProps {
    candidates: CandidateItem[];
    targetDatetime: Date;
    brotli: BrotliInstance;
}

/**
 * Component that just continuously shows the shareable link with a "Copy to Clipboard" button
 * @param brotli
 * @param candidates
 * @param targetDatetime
 * @constructor
 */
export const ShareLink = ({brotli, candidates, targetDatetime}: ShareLinkProps) => {
    const compressedParams = compress(brotli, targetDatetime, candidates);
    const queryString = `?p=${encodeURIComponent(compressedParams)}`;

    const linkText = `${window.location.origin}/${queryString}`;

    const onCopyClick = () => {
        console.debug(`Copied to Clipboard: ${linkText}`);

        navigator.clipboard.writeText(linkText);
    }

    return <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
        <p className="text-white mb-2 font-bold">Shareable Link</p>
        <div className={'flex flex-row'}>
            <div className={'flex flex-col w-11/12'}>
                <input
                    type="text"
                    readOnly
                    value={linkText}
                    className="w-full bg-gray-900 text-white p-2 rounded-lg font-mono text-sm"
                    onFocus={(e) => e.target.select()}
                />
            </div>
            <div className={'flex flex-col'}>
                <button
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={onCopyClick}
                >
                    Copy to Clipboard
                </button>
            </div>
        </div>
    </div>;
}