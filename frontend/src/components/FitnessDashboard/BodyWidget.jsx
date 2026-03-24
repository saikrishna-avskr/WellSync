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

const BodyWidget = ({ data }) => {
  const formatData = data
    .map((item) => ({
      date: item.date.toLocaleDateString(),
      weight: item.weight ? item.weight.toFixed(1) : null,
      height: item.height ? item.height.toFixed(2) : null,
    }))
    .filter((item) => item.weight || item.height);

  const latestWeight = data.find((item) => item.weight)?.weight || 0;
  const latestHeight = data.find((item) => item.height)?.height || 0;

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm text-slate-900">
      <h3 className="text-xl font-semibold mb-4">Body Measurements</h3>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold text-violet-600">
            {latestWeight.toFixed(1)} kg
          </p>
          <p className="text-sm text-slate-600">Weight</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-violet-600">
            {latestHeight.toFixed(2)} m
          </p>
          <p className="text-sm text-slate-600">Height</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formatData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="weight" orientation="left" />
          <YAxis yAxisId="height" orientation="right" />
          <Tooltip />
          <Bar
            yAxisId="weight"
            dataKey="weight"
            fill="#6366F1"
            name="Weight (kg)"
          />
          <Bar
            yAxisId="height"
            dataKey="height"
            fill="#14B8A6"
            name="Height (m)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BodyWidget;
