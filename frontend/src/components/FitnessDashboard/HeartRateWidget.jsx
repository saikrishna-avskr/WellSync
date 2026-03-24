import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HeartRateWidget = ({ data, averageHeartRate }) => {
  const formatData = data.map(item => ({
    date: item.date.toLocaleDateString(),
    heartRate: item.heartRate
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Heart Rate</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-red-600">{averageHeartRate.toFixed(1)}</p>
        <p className="text-sm text-gray-600">Average BPM</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="heartRate" stroke="#EF4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HeartRateWidget;