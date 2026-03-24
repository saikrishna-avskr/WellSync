import React, { useState, useEffect } from "react";
import DateRangeSelector from "../components/FitnessDashboard/DateRangeSelector";
import StepsWidget from "../components/FitnessDashboard/StepsWidget";
import HeartRateWidget from "../components/FitnessDashboard/HeartRateWidget";
import SleepWidget from "../components/FitnessDashboard/SleepWidget";
import NutritionWidget from "../components/FitnessDashboard/NutritionWidget";
import DistanceWidget from "../components/FitnessDashboard/DistanceWidget";
import BodyWidget from "../components/FitnessDashboard/BodyWidget";
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
  calculateFitnessScore,
} from "../utils/googleFitApi";

const FitnessDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ); // 7 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [fitnessData, setFitnessData] = useState({
    steps: [],
    heartRate: [],
    sleep: [],
    nutrition: [],
    distance: [],
    body: [],
  });
  const [summary, setSummary] = useState({
    totalSteps: 0,
    averageHeartRate: 0,
    totalSleepDuration: 0,
    totalCalories: 0,
    totalDistance: 0,
    fitnessScore: 0,
  });

  const applyFitnessData = ({
    stepsData,
    heartRateData,
    sleepData,
    nutritionData,
    distanceData,
    bodyData,
  }) => {
    setFitnessData({
      steps: stepsData,
      heartRate: heartRateData,
      sleep: sleepData,
      nutrition: nutritionData,
      distance: distanceData,
      body: bodyData,
    });

    const totalSteps = stepsData.reduce((sum, item) => sum + item.steps, 0);
    const averageHeartRate =
      heartRateData.length > 0
        ? heartRateData.reduce((sum, item) => sum + item.heartRate, 0) /
          heartRateData.length
        : 0;
    const totalSleepDuration = sleepData.reduce(
      (sum, item) => sum + item.sleepDuration,
      0,
    );
    const totalCalories = nutritionData.reduce(
      (sum, item) => sum + item.calories,
      0,
    );
    const totalDistance = distanceData.reduce(
      (sum, item) => sum + item.distance,
      0,
    );

    const fitnessScore = calculateFitnessScore({
      steps: totalSteps / Math.max(stepsData.length, 1),
      heartRate: averageHeartRate,
      sleep: totalSleepDuration / Math.max(sleepData.length, 1),
      calories: totalCalories / Math.max(nutritionData.length, 1),
      distance: totalDistance / Math.max(distanceData.length, 1),
    });

    setSummary({
      totalSteps,
      averageHeartRate,
      totalSleepDuration,
      totalCalories,
      totalDistance,
      fitnessScore,
    });
  };

  const handleAddTestData = () => {
    const dayInMs = 24 * 60 * 60 * 1000;
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const totalDays = Math.max(1, Math.floor((endMs - startMs) / dayInMs) + 1);

    const dates = Array.from({ length: totalDays }, (_, index) => {
      return new Date(startMs + index * dayInMs);
    });

    const stepsData = dates.map((date, index) => ({
      date,
      steps: 6000 + ((index * 1379) % 5000),
    }));

    const heartRateData = dates.map((date, index) => ({
      date,
      heartRate: 68 + (index % 10),
    }));

    const sleepData = dates.map((date, index) => ({
      date,
      sleepDuration: (6.3 + (index % 4) * 0.5) * 60 * 60 * 1000,
    }));

    const nutritionData = dates.map((date, index) => ({
      date,
      calories: 1700 + (index % 5) * 120,
    }));

    const distanceData = dates.map((date, index) => ({
      date,
      distance: Number((3.2 + (index % 6) * 0.55).toFixed(2)),
    }));

    const bodyData = dates.map((date, index) => ({
      date,
      weight: Number((72.4 - index * 0.03).toFixed(1)),
      height: 1.75,
    }));

    applyFitnessData({
      stepsData,
      heartRateData,
      sleepData,
      nutritionData,
      distanceData,
      bodyData,
    });
  };

  useEffect(() => {
    initGoogleAPI()
      .then(() => {
        if (isSignedIn()) {
          setIsAuthenticated(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleSignIn = async () => {
    try {
      await signIn();
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Sign in error:", error);
      const message = error?.message || "Unknown authentication error";
      alert(`Failed to sign in: ${message}`);
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
        body: [],
      });
      setSummary({
        totalSteps: 0,
        averageHeartRate: 0,
        totalSleepDuration: 0,
        totalCalories: 0,
        totalDistance: 0,
        fitnessScore: 0,
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const fetchFitnessData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      const metricLoaders = [
        {
          key: "steps",
          label: "Steps",
          loader: () => getStepsData(startTime, endTime),
        },
        {
          key: "heartRate",
          label: "Heart Rate",
          loader: () => getHeartRateData(startTime, endTime),
        },
        {
          key: "sleep",
          label: "Sleep",
          loader: () => getSleepData(startTime, endTime),
        },
        {
          key: "nutrition",
          label: "Nutrition",
          loader: () => getNutritionData(startTime, endTime),
        },
        {
          key: "distance",
          label: "Distance",
          loader: () => getDistanceData(startTime, endTime),
        },
        {
          key: "body",
          label: "Body",
          loader: () => getBodyData(startTime, endTime),
        },
      ];

      const results = await Promise.allSettled(
        metricLoaders.map((metric) => metric.loader()),
      );

      const failedMetrics = [];
      const metricData = {
        steps: [],
        heartRate: [],
        sleep: [],
        nutrition: [],
        distance: [],
        body: [],
      };

      results.forEach((result, index) => {
        const metric = metricLoaders[index];

        if (result.status === "fulfilled") {
          metricData[metric.key] = result.value || [];
          return;
        }

        console.error(`Failed to fetch ${metric.label} data:`, result.reason);
        failedMetrics.push(
          `${metric.label}: ${result.reason?.message || "Unknown error"}`,
        );
      });

      if (failedMetrics.length === metricLoaders.length) {
        throw new Error(failedMetrics.join(" | "));
      }

      if (failedMetrics.length > 0) {
        alert(
          `Some metrics could not be loaded:\n\n${failedMetrics.join("\n")}`,
        );
      }

      applyFitnessData({
        stepsData: metricData.steps,
        heartRateData: metricData.heartRate,
        sleepData: metricData.sleep,
        nutritionData: metricData.nutrition,
        distanceData: metricData.distance,
        bodyData: metricData.body,
      });
    } catch (error) {
      console.error("Error fetching fitness data:", error);
      const message = error?.message || "Unable to fetch Google Fit data";
      alert(`Failed to fetch fitness data: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFitnessData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 p-8 rounded-lg shadow-md text-center max-w-xl w-full text-slate-900">
          <h1 className="uppercase text-4xl md:text-5xl font-black font-zentry special-font mb-4 text-slate-900">
            Fitness Dashboard
          </h1>
          <p className="text-slate-600 mb-6 font-circular-web">
            Connect with Google Fit to view your fitness data
          </p>
          <button
            onClick={handleSignIn}
            className="px-6 py-3 rounded-full bg-violet-600 text-white font-general text-xs uppercase hover:bg-violet-700 transition duration-200"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white p-4 md:p-6 text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="uppercase text-4xl md:text-5xl font-black font-zentry special-font text-slate-900">
            Fitness Dashboard
          </h1>
          <div className="flex gap-4">
            <button
              onClick={handleAddTestData}
              className="px-4 py-2 rounded-full bg-violet-600 text-white font-general text-xs uppercase hover:bg-violet-700 transition duration-200"
            >
              Add Test Data
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 font-general text-xs uppercase hover:bg-slate-100 transition duration-200"
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
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            <p className="mt-2 text-slate-600">Loading fitness data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {summary.totalSteps.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Steps</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {summary.averageHeartRate.toFixed(1)}
                </p>
                <p className="text-sm text-slate-600">Avg HR</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {(summary.totalSleepDuration / (1000 * 60 * 60)).toFixed(1)}h
                </p>
                <p className="text-sm text-slate-600">Sleep</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {summary.totalCalories.toFixed(0)}
                </p>
                <p className="text-sm text-slate-600">Calories</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {summary.totalDistance.toFixed(2)}km
                </p>
                <p className="text-sm text-slate-600">Distance</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm text-center">
                <p className="text-2xl font-bold text-violet-300">
                  {summary.fitnessScore}
                </p>
                <p className="text-sm text-slate-600">Fitness Score</p>
              </div>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <StepsWidget
                data={fitnessData.steps}
                totalSteps={summary.totalSteps}
              />
              <HeartRateWidget
                data={fitnessData.heartRate}
                averageHeartRate={summary.averageHeartRate}
              />
              <SleepWidget
                data={fitnessData.sleep}
                totalSleepDuration={summary.totalSleepDuration}
              />
              <NutritionWidget
                data={fitnessData.nutrition}
                totalCalories={summary.totalCalories}
              />
              <DistanceWidget
                data={fitnessData.distance}
                totalDistance={summary.totalDistance}
              />
              <BodyWidget data={fitnessData.body} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FitnessDashboard;
