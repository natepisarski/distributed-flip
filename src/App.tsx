import React, {useState, useEffect, useRef} from 'react';
import logo from './logo.svg';
import './App.css';
import {List} from "./components/List";
import {formatDistance} from "date-fns";
import brotliPromise from 'brotli-wasm';

export interface CandidateItem {
    uuid: string;
    text: string;
}

const MAX_CANDIDATES = 4;

type BrotliInstance = {
    compress: (buf: Uint8Array, options?: any) => Uint8Array;
};

const App = () => {
    const [inputValue, setInputValue] = useState<string>("");

    // Sample data for the list box
    const [candidates, setCandidates] = useState<CandidateItem[]>([
        {uuid: crypto.randomUUID(), text: "First Option"},
        {uuid: crypto.randomUUID(), text: "Second Option"},
        {uuid: crypto.randomUUID(), text: "Third Option"},
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

    // Auto-scroll effect
    useEffect(() => {
        listEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [candidates]);

    const [brotli, setBrotli] = useState<BrotliInstance | null>(null);

    useEffect(() => {
        const loadBrotli = async () => {
            const instance = await brotliPromise;
            setBrotli(instance);
        };

        loadBrotli();
    }, []);

    if (! brotli) {
        return <div>Loading compression module...</div>;
    }

    const targetUtcDatetime = '2025-12-10T11:31:00Z';

    const targetDatetimeTooltip = new Date(targetUtcDatetime).toLocaleString();
    const targetDatetimeDisplayText = formatDistance(targetUtcDatetime, new Date());

    const onRemove = (uuid: string) => {
        setCandidates(candidates.filter(log => log.uuid !== uuid));
    }

    // const remaining = candidates.length;
    const atMaxCandidates = candidates.length >= MAX_CANDIDATES;

    const disabledClasses = atMaxCandidates
        ? 'opacity-50 cursor-not-allowed'
        : '';

    const data = JSON.stringify({targetUtcDatetime, candidates});
    console.debug(data);
    const compressedText = brotli.compress(Buffer.from(data), { quality: 20 });

    return (
        // 1. OUTER CONTAINER: Takes up full viewport height (h-screen)
        // We use flex + justify-center + items-center to perfectly center the inner content
        <div className="min-h-screen w-full bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl flex flex-col gap-2">
                <div className={'flex flex-row w-full items-center justify-center'}>
                    <h1 className="text-4xl font-bold text-white text-center tracking-wider">
                        Distributed Flipper
                    </h1>
                </div>
                <div className={'flex flex-row w-full mb-4 items-center justify-center text-white'}>
                    <div className={'flex flex-col'}>
                        <div className={'flex flex-row justify-center'}>
                            <p className={'text-white font-bold text-xl'}>List Selector</p>
                        </div>
                        <div className={'flex flex-row text-gray-300 text-xl'}>
                            <span>
                                A random item will be chosen in <span
                                className={'text-green-500 cursor-pointer hover:text-green-600'}
                                title={targetDatetimeTooltip}>{targetDatetimeDisplayText}</span>.
                            </span>
                        </div>
                    </div>
                </div>

                <List
                    candidates={candidates}
                    listEndRef={listEndRef}
                    onRemove={onRemove}
                />

                <div className="relative">
                    <input
                        type="text"
                        className={`w-full bg-gray-800 text-white text-xl p-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all ${disabledClasses}`}
                        placeholder={`Add Item (${candidates.length} / ${MAX_CANDIDATES})`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        disabled={atMaxCandidates}
                    />
                    <div
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm hidden sm:block">
                        Press Enter ↵
                    </div>
                </div>


                <div className={'bg-black text-green-300'}>
                    {compressedText}
                </div>

            </div>
        </div>
    );
}

export default App;
