import React, { useState, useEffect } from "react";
import {
  AmountConfig,
  DEFAULT_AMOUNT_MIN,
  DEFAULT_AMOUNT_MAX,
} from "../../types";
import { DateTimePicker } from "../shared/DateTimePicker";
import { useDrandRandomizer } from "../../hooks/useDrandRandomizer";

interface AmountTabProps {
  config: AmountConfig;
  setConfig: React.Dispatch<React.SetStateAction<AmountConfig>>;
  targetUtcDatetime: string;
  setTargetUtcDatetime: (datetime: string) => void;
  readonly: boolean;
}

/**
 * Validates the amount configuration.
 * Returns null if valid, or an error message if invalid.
 */
export const validateAmountConfig = (config: AmountConfig): string | null => {
  if (config.min >= config.max) {
    return "Minimum must be less than maximum";
  }
  if (!Number.isInteger(config.min) || !Number.isInteger(config.max)) {
    return "Values must be whole numbers";
  }
  return null;
};

export const AmountTab: React.FC<AmountTabProps> = ({
  config,
  setConfig,
  targetUtcDatetime,
  setTargetUtcDatetime,
  readonly,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const validationError = validateAmountConfig(config);
  const isValid = validationError === null;

  // Calculate range for randomizer (we need at least 1 item)
  const range = config.max - config.min + 1;

  // Use drand randomizer hook
  const { winnerIndex, isLoading } = useDrandRandomizer({
    targetDatetime: targetUtcDatetime,
    itemCount: range,
    isActive: readonly && result === null && isValid,
  });

  // Calculate result when we get the winning index
  useEffect(() => {
    if (winnerIndex !== null) {
      const calculatedResult = config.min + winnerIndex;
      setResult(calculatedResult);
    }
  }, [winnerIndex, config.min]);

  // Reset result if datetime or config changes
  useEffect(() => {
    if (!readonly) {
      setResult(null);
    }
  }, [targetUtcDatetime, config.min, config.max, readonly]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setConfig({ ...config, min: value });
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setConfig({ ...config, max: value });
    }
  };

  const handleDatetimeChange = (datetime: string) => {
    setTargetUtcDatetime(datetime);
    setResult(null);
  };

  // Show result view
  if (result !== null) {
    return (
      <div className="flex flex-col gap-4 items-center">
        {/* Header */}
        <div className="flex flex-col items-center">
          <p className="text-white font-bold text-xl">Your Number</p>
          <DateTimePicker
            targetUtcDatetime={targetUtcDatetime}
            onDatetimeChange={handleDatetimeChange}
            readonly={true}
            hasResult={true}
          />
        </div>

        {/* Result display */}
        <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 border-2 border-green-500 rounded-2xl p-8 shadow-2xl">
          <div className="text-8xl font-bold text-white text-center font-mono">
            {result}
          </div>
          <div className="text-gray-400 text-center mt-2 text-sm">
            Range: {config.min} – {config.max}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header with subtitle and date picker */}
      <div className="flex flex-col items-center">
        <p className="text-white font-bold text-xl">Random Number Generator</p>
        <DateTimePicker
          targetUtcDatetime={targetUtcDatetime}
          onDatetimeChange={handleDatetimeChange}
          readonly={readonly}
          hasResult={false}
        />
      </div>

      {/* Preview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-sm mb-2">
          Will generate a number between
        </div>
        <div className="text-4xl font-bold text-white font-mono">
          {config.min} – {config.max}
        </div>
        {!readonly && (
          <div className="text-gray-500 text-xs mt-2">
            ({range.toLocaleString()} possible values)
          </div>
        )}
      </div>

      {/* Advanced toggle (only when not readonly) */}
      {!readonly && (
        <div className="flex flex-col gap-2">
          <button
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span
              className={`transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            <span>Advanced</span>
          </button>

          {showAdvanced && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 ml-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Min input */}
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 text-sm">Min:</label>
                  <input
                    type="number"
                    className="w-24 bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={config.min}
                    onChange={handleMinChange}
                  />
                </div>

                {/* Max input */}
                <div className="flex items-center gap-2">
                  <label className="text-gray-300 text-sm">Max:</label>
                  <input
                    type="number"
                    className="w-24 bg-gray-700 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={config.max}
                    onChange={handleMaxChange}
                  />
                </div>

                {/* Reset button */}
                <button
                  className="text-gray-400 hover:text-white text-xs underline"
                  onClick={() =>
                    setConfig({
                      min: DEFAULT_AMOUNT_MIN,
                      max: DEFAULT_AMOUNT_MAX,
                    })
                  }
                >
                  Reset to defaults
                </button>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="mt-3 text-red-400 text-xs bg-red-900/20 border border-red-800 rounded p-2">
                  ⚠️ {validationError}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-blue-400 text-center animate-pulse">
          Contacting the League of Entropy...
        </div>
      )}

      {/* Waiting message */}
      {readonly && result === null && !isLoading && isValid && (
        <div className="text-yellow-400 text-center animate-pulse">
          Waiting for target time...
        </div>
      )}
    </div>
  );
};
