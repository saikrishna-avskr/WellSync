import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const NutritionWidget = ({ data, totalCalories }) => {
  // Mock data for nutrition distribution - in a real app, you'd parse actual nutrition data
  const nutritionData = [
    { name: 'Carbs', value: 45, color: '#FFBB28' },
    { name: 'Protein', value: 30, color: '#00C49F' },
    { name: 'Fat', value: 20, color: '#FF8042' },
    { name: 'Other', value: 5, color: '#8884D8' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Calories / Nutrition</h3>
      <div className="mb-4">
        <p className="text-3xl font-bold text-green-600">{totalCalories.toFixed(0)}</p>
        <p className="text-sm text-gray-600">Total Calories</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={nutritionData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {nutritionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NutritionWidget;