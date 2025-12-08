import React, {useState, useEffect, useRef} from 'react';
import logo from './logo.svg';
import './App.css';
import {List} from "./components/List";
import { formatDistance } from "date-fns";

interface CandidateItem {
    uuid: string;
    text: string;
}

const App = () => {
    const [inputValue, setInputValue] = useState<string>("");

    // Sample data for the list box
    const [logs, setLogs] = useState<CandidateItem[]>([
        {uuid: crypto.randomUUID(), text: "First Option"},
        {uuid: crypto.randomUUID(), text: "Second Option"},
        {uuid: crypto.randomUUID(), text: "Third Option"},
    ]);

    // Ref to auto-scroll the list to the bottom
    const listEndRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            setLogs([...logs, {uuid: Date.now().toString(), text: inputValue}]);
            setInputValue("");
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        listEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [logs]);

    const targetUtcDatetime = '2025-12-10T11:31:00Z';
    const date = '2025-01-01 12:00:00';

    const targetDatetimeTooltip = new Date(targetUtcDatetime).toLocaleString();
    const targetDatetimeDisplayText = formatDistance(targetUtcDatetime, new Date());

    // const targetDatetimeTooltip = 'a';
    // const targetDatetimeDisplayText = 'b';

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
                                A random item will be chosen in <span className={'text-green-500 cursor-pointer hover:text-green-600'} title={targetDatetimeTooltip}>{targetDatetimeDisplayText}</span>.
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 h-64 overflow-y-auto shadow-xl">
                    {logs.length === 0 ? (
                        <p className="text-gray-500 italic">No activity yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {logs.map((log) => (
                                <li key={log.uuid}
                                    className="text-gray-300 font-mono text-sm border-b border-gray-700/50 pb-1 last:border-0">
                                    <span className="text-green-500 mr-2">➜</span>
                                    {log.text}
                                </li>
                            ))}
                            {/* Invisible element to anchor scroll to bottom */}
                            <div ref={listEndRef}/>
                        </ul>
                    )}
                </div>

                {/* 4. INPUT BOX: The "Interaction" area */}
                <div className="relative">
                    <input
                        type="text"
                        className="w-full bg-gray-800 text-white text-xl p-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all"
                        placeholder="Enter command..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm hidden sm:block">
                        Press Enter ↵
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;
