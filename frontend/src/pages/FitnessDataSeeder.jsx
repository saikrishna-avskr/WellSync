import React, { useState } from 'react';

const FitnessDataSeeder = () => {
  const [message, setMessage] = useState('');

  const showLimitations = () => {
    setMessage(`⚠️ Google Fit API Limitations:

The Google Fit REST API primarily allows READING fitness data, not writing/inserting it. This is a security measure by Google.

To populate test data, you have these options:

1. 📱 Use Google Fit Mobile App:
   - Install Google Fit on your phone
   - Manually add activities, meals, weight, etc.
   - Use the app to simulate activities

2. 🖥️ Use Google Fit Web Interface:
   - Go to fit.google.com
   - Add manual entries for testing

3. 📊 Use Mock Data for Development:
   - The dashboard can display mock data for development
   - Toggle mock data mode in the dashboard

4. 🤖 Use Fitness Tracking Apps:
   - Connect wearables/fitness trackers
   - Let them sync real data automatically

For this demo, we recommend using the Google Fit mobile app to add sample data manually.`);
  };

  const openGoogleFitWeb = () => {
    window.open('https://fit.google.com', '_blank');
  };

  const openGoogleFitApp = () => {
    window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.fitness', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Fitness Data Seeder</h1>
          <p className="text-gray-600 mb-6">
            Learn how to populate your Google Fit account with test data to visualize in the Fitness Dashboard.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">📱 Mobile App Method</h3>
              <p className="text-blue-700 mb-4">
                Use the Google Fit mobile app to manually add fitness data.
              </p>
              <button
                onClick={openGoogleFitApp}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Download Google Fit App
              </button>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">🖥️ Web Interface Method</h3>
              <p className="text-green-700 mb-4">
                Use the Google Fit web interface to add manual entries.
              </p>
              <button
                onClick={openGoogleFitWeb}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
              >
                Open Google Fit Web
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">📋 Manual Data Entry Steps</h3>
            <div className="text-yellow-700 space-y-2">
              <p><strong>Steps/Activity:</strong> Add a "Walk" or "Run" activity with duration and distance</p>
              <p><strong>Heart Rate:</strong> Add manual heart rate readings throughout the day</p>
              <p><strong>Sleep:</strong> Log sleep sessions with start/end times</p>
              <p><strong>Nutrition:</strong> Add meals with calorie counts</p>
              <p><strong>Weight:</strong> Record daily weight measurements</p>
              <p><strong>Height:</strong> Add height measurement (usually one-time)</p>
            </div>
          </div>

          <button
            onClick={showLimitations}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 mb-4"
          >
            Why Can't I Auto-Populate Data?
          </button>

          {message && (
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{message}</pre>
            </div>
          )}

          <div className="mt-8 bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">🚀 Quick Test Data Ideas</h3>
            <div className="text-purple-700 space-y-2">
              <p>• <strong>Today:</strong> Add a 30-minute walk (5000 steps, 3km)</p>
              <p>• <strong>Yesterday:</strong> Add sleep: 10PM-6AM (8 hours)</p>
              <p>• <strong>Meals:</strong> Breakfast 400cal, Lunch 600cal, Dinner 500cal</p>
              <p>• <strong>Weight:</strong> Record your current weight</p>
              <p>• <strong>Heart Rate:</strong> Add 2-3 readings (morning: 65, evening: 72)</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/fitness-dashboard"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-200"
            >
              ← Back to Fitness Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessDataSeeder;