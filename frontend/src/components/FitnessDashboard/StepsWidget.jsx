import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StepsWidget = ({ data, totalSteps }) => {
  const formatData = data.map((item) => ({
    date: item.date.toLocaleDateString(),
    steps: item.steps,
  }));

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm text-slate-900">
      <h3 className="text-xl font-semibold mb-4">Steps / Physical Activity</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-violet-600">
          {totalSteps.toLocaleString()}
        </p>
        <p className="text-sm text-slate-600">Total Steps</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formatData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="steps" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StepsWidget;
