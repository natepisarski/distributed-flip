import React, {useState, useEffect, useRef} from 'react';
import logo from './logo.svg';
import './App.css';
import {List} from "./components/List";
import {addHours, formatDistance, isBefore} from "date-fns";
import brotliPromise from 'brotli-wasm';
import {compress, restore} from "./business/compression-restore";
import {ShareLink} from "./components/ShareLink";
import {format} from "date-fns/format";

export interface CandidateItem {
    uuid: string;
    text: string;
}

const MAX_CANDIDATES = 4;

export type BrotliInstance = {
    compress: (buf: Uint8Array, options?: any) => Uint8Array;
    decompress: (buf: Uint8Array) => Uint8Array;
};

const App = () => {
    // If the querystring contains the 'p' parameter with compressed data, we restore it here.
    const compressedParam = new URLSearchParams(window.location.search).get('p');

    const defaultTargetUtcDatetime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in the future
    const [targetUtcDatetime, setTargetUtcDatetime] = useState<string>(defaultTargetUtcDatetime.toISOString());
    const targetDatetimeTooltip = new Date(targetUtcDatetime).toLocaleString();
    const targetDatetimeDisplayText = formatDistance(targetUtcDatetime, new Date());
    const targetDatetimeDate = new Date(targetUtcDatetime);

    const [inputValue, setInputValue] = useState<string>("");

    // Sample data for the list box
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

    useEffect(() => {
        if (brotli && compressedParam) {
            const restoration = restore(brotli, window.location.search)
            setTargetUtcDatetime(restoration.targetDatetime);
            setCandidates(restoration.candidates);
        }
    }, [brotli, compressedParam]);

    const onRemove = (uuid: string) => {
        setCandidates(candidates.filter(log => log.uuid !== uuid));
    }

    // const remaining = candidates.length;
    const atMaxCandidates = candidates.length >= MAX_CANDIDATES;

    const disabledClasses = atMaxCandidates
        ? 'opacity-50 cursor-not-allowed'
        : '';

    const [datePickerShown, setDatePickerShown] = useState<boolean>(false);

    const toggleDatePicker = () => setDatePickerShown(true);

    if (! brotli) {
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
            return;
        }

        const newDate = new Date(inputValue);
        setTargetUtcDatetime(newDate.toISOString());
    };

    const handleDatepickerKeydown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            setDatePickerShown(false);
        }
    }

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
        <span
            className={'text-green-500 cursor-pointer hover:text-green-600 hover:underline'}
            title={targetDatetimeTooltip}
            onClick={toggleDatePicker}
        >
        {` ${targetDatetimeDisplayText}`}
    </span>
    );

    // Every minute, we should see if the target time has passed. If it has (and we haven't already discovered the winner)
    // we figure out who won.

    const isChosenAlready = isBefore(targetUtcDatetime, Date.now());

    return (
        <div className="min-h-screen w-full bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-6xl flex flex-col gap-2">
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
                                A random item will be chosen {datePickerWord}
                                {dateComponent}
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

                <ShareLink brotli={brotli} candidates={candidates} targetDatetime={targetDatetimeDate} />
            </div>
        </div>
    );
}

export default App;
