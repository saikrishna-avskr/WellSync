import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DistanceWidget = ({ data, totalDistance }) => {
  const formatData = data.map(item => ({
    date: item.date.toLocaleDateString(),
    distance: item.distance.toFixed(2)
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Distance / Location</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-orange-600">{totalDistance.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Total KM</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="distance" stroke="#F97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistanceWidget;