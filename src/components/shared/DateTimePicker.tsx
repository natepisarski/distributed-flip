import React, { useState, useEffect } from "react";
import { format, addHours, isBefore, formatDistance } from "date-fns";

interface DateTimePickerProps {
  targetUtcDatetime: string;
  onDatetimeChange: (datetime: string) => void;
  readonly: boolean;
  showResultLabel?: boolean;
  hasResult?: boolean;
}

/**
 * Shared datetime picker component for selecting target time.
 * Validates date only on blur (when user finishes editing), not during typing.
 */
export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  targetUtcDatetime,
  onDatetimeChange,
  readonly,
  showResultLabel = false,
  hasResult = false,
}) => {
  const [datePickerShown, setDatePickerShown] = useState(false);
  const [dateError, setDateError] = useState(false);
  // Track the current input value separately to allow free typing
  const [inputValue, setInputValue] = useState("");

  const targetDatetimeDate = new Date(targetUtcDatetime);
  const targetDatetimeTooltip = targetDatetimeDate.toLocaleString();
  let targetDatetimeDisplayText = formatDistance(targetUtcDatetime, new Date());

  // Initialize input value when picker opens
  useEffect(() => {
    if (datePickerShown) {
      setInputValue(format(targetDatetimeDate, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [datePickerShown, targetUtcDatetime]);

  // Clear date error after 2 seconds
  useEffect(() => {
    if (dateError) {
      const timeout = setTimeout(() => setDateError(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [dateError]);

  const toggleDatePicker = () => {
    if (!readonly) setDatePickerShown(true);
  };

  const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  // Handle input change - just update local state, don't validate yet
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  // Validate and commit the date when user finishes editing (blur or Enter)
  const commitDate = (): void => {
    // If empty, reset to now + 1 hour
    if (!inputValue) {
      const resetDate = addHours(new Date(), 1);
      onDatetimeChange(resetDate.toISOString());
      setDatePickerShown(false);
      return;
    }

    const newDate = new Date(inputValue);

    // Check if the date is valid
    if (isNaN(newDate.getTime())) {
      setDateError(true);
      // Reset to previous valid value
      setInputValue(format(targetDatetimeDate, "yyyy-MM-dd'T'HH:mm"));
      return;
    }

    // Validate that the selected date is not in the past
    if (isBefore(newDate, new Date())) {
      setDateError(true);
      // Reset to previous valid value
      setInputValue(format(targetDatetimeDate, "yyyy-MM-dd'T'HH:mm"));
      return;
    }

    // Valid date - commit it
    onDatetimeChange(newDate.toISOString());
    setDatePickerShown(false);
  };

  const handleBlur = (): void => {
    commitDate();
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      commitDate();
    } else if (e.key === "Escape") {
      // Cancel without saving
      setInputValue(format(targetDatetimeDate, "yyyy-MM-dd'T'HH:mm"));
      setDatePickerShown(false);
    }
  };

  const datePickerWord = datePickerShown ? "at" : "in";

  let dateTimeText = "";
  let dateDisplayClasses: string[] = dateError
    ? ["text-red-500", "animate-pulse", "transition-colors"]
    : ["text-green-500"];
  let dateOnclickHandler = () => {};

  if (readonly) {
    targetDatetimeDisplayText = format(targetDatetimeDate, "PPpp");
    if (hasResult) {
      dateTimeText = showResultLabel ? "Result determined at" : "Determined at";
      dateDisplayClasses = [...dateDisplayClasses, "font-bold"];
    } else {
      dateTimeText = "Waiting for result at";
      dateDisplayClasses = [...dateDisplayClasses, "italic"];
    }
  } else {
    dateTimeText = `Selection will occur ${datePickerWord}`;
    dateDisplayClasses = [
      ...dateDisplayClasses,
      "cursor-pointer",
      "hover:text-green-600",
      "hover:underline",
    ];
    dateOnclickHandler = toggleDatePicker;
  }

  const dateDisplayClassesStr = dateDisplayClasses.join(" ");

  if (datePickerShown) {
    return (
      <div className="flex flex-row text-gray-300 text-xl justify-center items-center gap-2">
        <input
          type="datetime-local"
          className="p-1 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={inputValue}
          min={nowLocal}
          onChange={handleInputChange}
          onKeyDown={handleKeydown}
          onBlur={handleBlur}
          autoFocus
        />
        {dateError && (
          <span className="text-red-400 text-sm">Must be in the future</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-row text-gray-300 text-xl justify-center">
      <span className="mr-1">{dateTimeText}</span>
      <span
        className={dateDisplayClassesStr}
        title={targetDatetimeTooltip}
        onClick={dateOnclickHandler}
      >
        {targetDatetimeDisplayText}
      </span>
    </div>
  );
};
