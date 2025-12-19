import React, {useState, useEffect, useRef} from 'react';
import './App.css';
import {List} from "./components/List";
import {addHours, formatDistance, isBefore} from "date-fns";
import brotliPromise from 'brotli-wasm';
import {compress, restore} from "./business/compression-restore";
import {ShareLink} from "./components/ShareLink";
import {format} from "date-fns/format";
import {fetchBeaconByTime, HttpCachingChain, HttpChainClient} from "drand-client";
import {read} from "node:fs";
import {identity} from "./business/functions";

// Drand Mainnet Chain Hash
const CHAIN_HASH = '8990e7a9aaed2f3b507c95208331d5dd0c99db496340696d090954a4bbe93481';

export interface CandidateItem {
    uuid: string;
    text: string;
}

const MAX_CANDIDATES = 10;

export type BrotliInstance = {
    compress: (buf: Uint8Array, options?: any) => Uint8Array;
    decompress: (buf: Uint8Array) => Uint8Array;
};

const getModeEmoji = (readonly: boolean, winnerUuid: string | null): string => {
    if (readonly) {
        if (winnerUuid) {
            return "🏅";
        } else {
            return "⏳";
        }
    } else {
        return "📝";
    }
};

const App = () => {
    // If the querystring contains the 'p' parameter with compressed data, we restore it here.
    const compressedParam = new URLSearchParams(window.location.search).get('p');

    const defaultTargetUtcDatetime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in the future
    const [targetUtcDatetime, setTargetUtcDatetime] = useState<string>(defaultTargetUtcDatetime.toISOString());
    const targetDatetimeTooltip = new Date(targetUtcDatetime).toLocaleString();
    let targetDatetimeDisplayText = formatDistance(targetUtcDatetime, new Date());
    const targetDatetimeDate = new Date(targetUtcDatetime);

    // If the p parameter is present, we are in "competition mode" where we're either displaying a result or waiting for a result.
    const isParameterPresent = compressedParam !== null;

    const [inputValue, setInputValue] = useState<string>("");
    const [winnerUuid, setWinnerUuid] = useState<string | null>(null);
    const [isLoadingResult, setIsLoadingResult] = useState<boolean>(false);
    const [isReadonly, setIsReadonly] = useState<boolean>(isParameterPresent);

    let modeEmoji = getModeEmoji(isReadonly, winnerUuid);

    const [candidates, setCandidates] = useState<CandidateItem[]>([
        {uuid: crypto.randomUUID(), text: "Heads"},
        {uuid: crypto.randomUUID(), text: "Tails"},
    ]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            setCandidates([
                    ...candidates,
                    {
                        uuid: crypto.randomUUID(),
                        text: inputValue
                    }
                ]
            );
            setInputValue("");
        }
    };

    const listEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll effect for the candidate list
    useEffect(() => {
        if (!winnerUuid) {
            listEndRef.current?.scrollIntoView({behavior: "smooth"});
        }
    }, [candidates, winnerUuid]);

    const [brotli, setBrotli] = useState<BrotliInstance | null>(null);

    useEffect(() => {
        const loadBrotli = async () => {
            const instance = await brotliPromise;
            setBrotli(instance);
        };

        loadBrotli();
    }, []);

    // Uses Brotli to restore the list and target time from the compressed URL parameter if it exists
    useEffect(() => {
        if (brotli && compressedParam) {
            const restoration = restore(brotli, window.location.search)
            setTargetUtcDatetime(restoration.targetDatetime);
            setCandidates(restoration.candidates);
            // Reset winner if URL changes
            setWinnerUuid(null);
        }
    }, [brotli, compressedParam]);

    // DRAND Logic - this is what chooses the winner
    useEffect(() => {
        // If we already have a winner, stop checking
        if (winnerUuid) {
            return;
        }
        // If the list is still being edited, don't try to select a winner yet
        if (! isReadonly) {
            return;
        }

        // Checks to see if the target time has passed; if it has
        const checkTimeAndFetch = async () => {
            const now = Date.now();
            const target = new Date(targetUtcDatetime).getTime();

            // Only fetch if the time has passed
            if (now >= target) {
                setIsLoadingResult(true);
                try {
                    const options = {
                        disableBeaconVerification: true,
                        noCache: false,
                    }

                    const chain = new HttpCachingChain('https://api.drand.sh', options)
                    const client = new HttpChainClient(chain, options)

                    // Fetch the beacon for the target time
                    const theBeacon = await fetchBeaconByTime(client, target);

                    // Convert randomness hex to BigInt
                    const randomnessVal = BigInt(`0x${theBeacon.randomness}`);

                    // Standard Modulo to pick a winner
                    // We cast to Number for the index access, safe for list lengths < 2^53
                    const winnerIndex = Number(randomnessVal % BigInt(candidates.length));

                    setWinnerUuid(candidates[winnerIndex].uuid);
                } catch (e) {
                    console.error("Failed to fetch drand beacon:", e);
                    // Optional: Add retry logic here if needed
                } finally {
                    setIsLoadingResult(false);
                }
            }
        };

        // Run immediately on mount/update to catch if we loaded a past link
        checkTimeAndFetch();

        // Poll every 10 seconds to catch the transition "live"
        const intervalId = setInterval(checkTimeAndFetch, 10000);

        return () => clearInterval(intervalId);
    }, [targetUtcDatetime, winnerUuid, candidates, isReadonly]);
    // --- DRAND LOGIC END ---

    const onListRemoveCandidate = (uuid: string) => {
        setCandidates(candidates.filter(log => log.uuid !== uuid));
    }

    const atMaxCandidates = candidates.length >= MAX_CANDIDATES;

    const disabledClasses = atMaxCandidates || winnerUuid
        ? 'opacity-50 cursor-not-allowed'
        : '';

    const [datePickerShown, setDatePickerShown] = useState<boolean>(false);

    const toggleDatePicker = () => {
        if (!winnerUuid) setDatePickerShown(true);
    };

    if (!brotli) {
        return <div>Loading compression module...</div>;
    }

    const datePickerWord = datePickerShown ? 'at' : 'in';

    const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm");

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const inputValue = e.target.value;

        // If they use the built-in "Clear" button we just reset it to now + 1 hour
        if (!inputValue) {
            const resetDate = addHours(new Date(), 1);
            setTargetUtcDatetime(resetDate.toISOString());
            setWinnerUuid(null); // Reset winner if date changes
            return;
        }

        const newDate = new Date(inputValue);
        setTargetUtcDatetime(newDate.toISOString());
        setWinnerUuid(null); // Reset winner if date changes
    };

    const handleDatepickerKeydown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            setDatePickerShown(false);
        }
    }

    // Prevents the list from being edited, and switches to a view more suitable for viewing results rather than editing them.
    const makeListReadonly = () => {
        setIsReadonly(true);
    };

    const readonly = isReadonly || !!winnerUuid;

    console.debug('Winner UUID:', winnerUuid);


    let dateTimeText = null;
    let dateDisplayClasses: string[] | string = ['text-green-500'];
    let dateOnclickHandler = () => {
    };

    if (readonly) {
        targetDatetimeDisplayText = format(new Date(targetUtcDatetime), "PPpp");
        if (winnerUuid) {
            dateTimeText = `Result determined at`;
            dateDisplayClasses = [...dateDisplayClasses, 'font-bold'];
        } else {
            dateTimeText = `Waiting for result at`;
            dateDisplayClasses = [...dateDisplayClasses, 'italic'];
        }
    } else {
        dateTimeText = `A random item will be chosen ${datePickerWord}`;
        dateDisplayClasses = [...dateDisplayClasses, 'cursor-pointer', 'hover:text-green-600', 'hover:underline'];
        dateOnclickHandler = toggleDatePicker;
    }

    dateDisplayClasses = dateDisplayClasses.join(' ');

    const dateComponent = datePickerShown ? (
        <input
            type="datetime-local"
            className="ml-2 p-1 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={targetUtcDatetime ? format(new Date(targetUtcDatetime), "yyyy-MM-dd'T'HH:mm") : ''}
            min={nowLocal}
            onChange={handleDateChange}
            onKeyDown={handleDatepickerKeydown}
            onBlur={() => setDatePickerShown(false)}
            autoFocus
        />
    ) : (
        <>
            <span className={'mr-1'}>
                {/* This will be everything before the actual time, like "Will show results at" or "Result determined at"*/}
                {` ${dateTimeText} `}
            </span>
            <span
                className={dateDisplayClasses}
                title={targetDatetimeTooltip}
                onClick={dateOnclickHandler}
            >
        {targetDatetimeDisplayText}
    </span>
        </>
    );

    return (
        <div className="min-h-screen w-full bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-6xl flex flex-col gap-2">
                <div className={'flex flex-row w-full items-center justify-center'}>
                    <a href={'/'}>
                        <h1 className="text-4xl font-bold text-white text-center tracking-wider cursor-pointer hover:underline hover:text-blue-400">
                            {modeEmoji} Distributed Flipper
                        </h1>
                    </a>
                </div>
                <div className={'flex flex-row w-full mb-4 items-center justify-center text-white'}>
                    <div className={'flex flex-col'}>
                        <div className={'flex flex-row justify-center'}>
                            <p className={'text-white font-bold text-xl'}>
                                {winnerUuid ? "Result Determined" : "List Selector"}
                            </p>
                        </div>
                        <div className={'flex flex-row text-gray-300 text-xl justify-center'}>
                            {dateComponent}
                        </div>
                    </div>
                </div>

                <List
                    candidates={candidates}
                    listEndRef={listEndRef}
                    onRemove={onListRemoveCandidate}
                    winnerUuid={winnerUuid}
                    readonly={readonly}
                />

                {/* Only show input if we're not in readonly mode */}
                {!readonly && (
                    <div className="relative">
                        <input
                            type="text"
                            className={`w-full bg-gray-800 text-white text-xl p-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all ${disabledClasses}`}
                            placeholder={`Add Item (${candidates.length} / ${MAX_CANDIDATES})`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={atMaxCandidates || !!winnerUuid}
                        />
                        <div
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm hidden sm:block">
                            Press Enter ↵
                        </div>
                    </div>
                )}

                {isLoadingResult && (
                    <div className="text-blue-400 text-center animate-pulse">Contacting the League of Entropy...</div>
                )}

                <ShareLink brotli={brotli} candidates={candidates} targetDatetime={targetDatetimeDate}
                           enableCompetition={makeListReadonly}/>
            </div>
        </div>
    );
}

export default App;