import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateRangeSelector = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetchData,
}) => {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm mb-6 text-slate-900">
      <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Start Date
          </label>
          <DatePicker
            selected={startDate}
            onChange={onStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-600 mb-2">
            End Date
          </label>
          <DatePicker
            selected={endDate}
            onChange={onEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <button
          onClick={onFetchData}
          className="px-6 py-2 rounded-full bg-violet-600 text-white font-general text-xs uppercase hover:bg-violet-700 transition duration-200"
        >
          Fetch Data
        </button>
      </div>
    </div>
  );
};

export default DateRangeSelector;
