import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StepsWidget = ({ data, totalSteps }) => {
  const formatData = data.map(item => ({
    date: item.date.toLocaleDateString(),
    steps: item.steps
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Steps / Physical Activity</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-blue-600">{totalSteps.toLocaleString()}</p>
        <p className="text-sm text-gray-600">Total Steps</p>
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