import React, { useState, useEffect } from 'react';
import DateRangeSelector from '../components/FitnessDashboard/DateRangeSelector';
import StepsWidget from '../components/FitnessDashboard/StepsWidget';
import HeartRateWidget from '../components/FitnessDashboard/HeartRateWidget';
import SleepWidget from '../components/FitnessDashboard/SleepWidget';
import NutritionWidget from '../components/FitnessDashboard/NutritionWidget';
import DistanceWidget from '../components/FitnessDashboard/DistanceWidget';
import BodyWidget from '../components/FitnessDashboard/BodyWidget';
import {
  initGoogleAPI,
  signIn,
  signOut,
  isSignedIn,
  getStepsData,
  getHeartRateData,
  getSleepData,
  getNutritionData,
  getDistanceData,
  getBodyData,
  calculateFitnessScore
} from '../utils/googleFitApi';

const FitnessDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState({
    steps: [],
    heartRate: [],
    sleep: [],
    nutrition: [],
    distance: [],
    body: []
  });
  const [summary, setSummary] = useState({
    totalSteps: 0,
    averageHeartRate: 0,
    totalSleepDuration: 0,
    totalCalories: 0,
    totalDistance: 0,
    fitnessScore: 0
  });

  useEffect(() => {
    initGoogleAPI().then(() => {
      if (isSignedIn()) {
        setIsAuthenticated(true);
      }
    }).catch(console.error);
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please check your Google API configuration.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setFitnessData({
        steps: [],
        heartRate: [],
        sleep: [],
        nutrition: [],
        distance: [],
        body: []
      });
      setSummary({
        totalSteps: 0,
        averageHeartRate: 0,
        totalSleepDuration: 0,
        totalCalories: 0,
        totalDistance: 0,
        fitnessScore: 0
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const fetchFitnessData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      const [stepsData, heartRateData, sleepData, nutritionData, distanceData, bodyData] = await Promise.all([
        getStepsData(startTime, endTime),
        getHeartRateData(startTime, endTime),
        getSleepData(startTime, endTime),
        getNutritionData(startTime, endTime),
        getDistanceData(startTime, endTime),
        getBodyData(startTime, endTime)
      ]);

      setFitnessData({
        steps: stepsData,
        heartRate: heartRateData,
        sleep: sleepData,
        nutrition: nutritionData,
        distance: distanceData,
        body: bodyData
      });

      // Calculate summary
      const totalSteps = stepsData.reduce((sum, item) => sum + item.steps, 0);
      const averageHeartRate = heartRateData.length > 0
        ? heartRateData.reduce((sum, item) => sum + item.heartRate, 0) / heartRateData.length
        : 0;
      const totalSleepDuration = sleepData.reduce((sum, item) => sum + item.sleepDuration, 0);
      const totalCalories = nutritionData.reduce((sum, item) => sum + item.calories, 0);
      const totalDistance = distanceData.reduce((sum, item) => sum + item.distance, 0);

      const fitnessScore = calculateFitnessScore({
        steps: totalSteps / Math.max(stepsData.length, 1),
        heartRate: averageHeartRate,
        sleep: totalSleepDuration / Math.max(sleepData.length, 1),
        calories: totalCalories / Math.max(nutritionData.length, 1),
        distance: totalDistance / Math.max(distanceData.length, 1)
      });

      setSummary({
        totalSteps,
        averageHeartRate,
        totalSleepDuration,
        totalCalories,
        totalDistance,
        fitnessScore
      });
    } catch (error) {
      console.error('Error fetching fitness data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Fitness Dashboard</h1>
          <p className="text-gray-600 mb-6">Connect with Google Fit to view your fitness data</p>
          <button
            onClick={handleSignIn}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Fitness Dashboard</h1>
          <div className="flex gap-4">
            <a
              href="/fitness-data-seeder"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
            >
              Add Test Data
            </a>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>

        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onFetchData={fetchFitnessData}
        />

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading fitness data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalSteps.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Steps</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-red-600">{summary.averageHeartRate.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg HR</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-purple-600">{(summary.totalSleepDuration / (1000 * 60 * 60)).toFixed(1)}h</p>
                <p className="text-sm text-gray-600">Sleep</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-green-600">{summary.totalCalories.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.totalDistance.toFixed(2)}km</p>
                <p className="text-sm text-gray-600">Distance</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md text-center">
                <p className="text-2xl font-bold text-indigo-600">{summary.fitnessScore}</p>
                <p className="text-sm text-gray-600">Fitness Score</p>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <StepsWidget data={fitnessData.steps} totalSteps={summary.totalSteps} />
              <HeartRateWidget data={fitnessData.heartRate} averageHeartRate={summary.averageHeartRate} />
              <SleepWidget data={fitnessData.sleep} totalSleepDuration={summary.totalSleepDuration} />
              <NutritionWidget data={fitnessData.nutrition} totalCalories={summary.totalCalories} />
              <DistanceWidget data={fitnessData.distance} totalDistance={summary.totalDistance} />
              <BodyWidget data={fitnessData.body} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FitnessDashboard;