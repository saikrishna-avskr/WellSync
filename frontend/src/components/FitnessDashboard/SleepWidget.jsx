import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SleepWidget = ({ data, totalSleepDuration }) => {
  const formatData = data.map((item) => ({
    date: item.date.toLocaleDateString(),
    sleepHours: (item.sleepDuration / (1000 * 60 * 60)).toFixed(2),
  }));

  const totalHours = (totalSleepDuration / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm text-slate-900">
      <h3 className="text-xl font-semibold mb-4">Sleep Data</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-violet-600">{totalHours}</p>
        <p className="text-sm text-slate-600">Total Hours</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="sleepHours"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepWidget;
