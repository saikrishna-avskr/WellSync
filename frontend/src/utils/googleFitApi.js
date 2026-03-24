// Google Fit API configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.location.read'
].join(' ');

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize Google Identity Services
export const initGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    // Load the Google Identity Services script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
      });
      gisInited = true;

      // Load the Google API script
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest']
            });
            gapiInited = true;

            // Initialize token client
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: SCOPES,
              callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                  window.gapi.client.setToken({ access_token: tokenResponse.access_token });
                  resolve();
                } else {
                  reject(new Error('Failed to get access token'));
                }
              }
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      gapiScript.onerror = reject;
      document.head.appendChild(gapiScript);
    };
    gisScript.onerror = reject;
    document.head.appendChild(gisScript);
  });
};

const handleCredentialResponse = (response) => {
  console.log('Credential response:', response);
};

// Sign in to Google
export const signIn = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    try {
      tokenClient.requestAccessToken({ prompt: 'consent' });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Sign out from Google
export const signOut = () => {
  return new Promise((resolve) => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken(null);
    }

    // Clear any stored tokens
    localStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_access_token');

    resolve();
  });
};

// Check if user is signed in (has valid access token)
export const isSignedIn = () => {
  if (!window.gapi || !window.gapi.client) return false;

  const token = window.gapi.client.getToken();
  if (!token) return false;

  // Check if token is expired
  const now = Date.now() / 1000;
  return token.expires_at > now;
};

// Get user profile (requires additional scope)
export const getUserProfile = () => {
  // This would require 'profile' scope which we don't have
  // For now, return basic info if available
  return {
    name: 'User',
    email: 'user@example.com'
  };
};

// Convert nanoseconds to milliseconds
const nanoToMilli = (nano) => Math.floor(nano / 1000000);

// Convert timestamp to readable date
export const formatTimestamp = (timestamp) => {
  const date = new Date(nanoToMilli(timestamp));
  return date.toLocaleString();
};

// Fetch fitness data
export const fetchFitnessData = async (dataType, startTime, endTime) => {
  try {
    const response = await gapi.client.fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{
          dataTypeName: dataType
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: startTime,
        endTimeMillis: endTime
      }
    });

    return response.result.bucket;
  } catch (error) {
    console.error('Error fetching fitness data:', error);
    throw error;
  }
};

// Get steps data
export const getStepsData = async (startTime, endTime) => {
  const buckets = await fetchFitnessData('com.google.step_count.delta', startTime, endTime);
  return buckets.map(bucket => ({
    date: new Date(parseInt(bucket.startTimeMillis)),
    steps: bucket.dataset[0]?.point?.[0]?.value?.[0]?.intVal || 0
  }));
};

// Get heart rate data
export const getHeartRateData = async (startTime, endTime) => {
  const buckets = await fetchFitnessData('com.google.heart_rate.bpm', startTime, endTime);
  return buckets.map(bucket => ({
    date: new Date(parseInt(bucket.startTimeMillis)),
    heartRate: bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0
  }));
};

// Get sleep data
export const getSleepData = async (startTime, endTime) => {
  const buckets = await fetchFitnessData('com.google.sleep.segment', startTime, endTime);
  return buckets.map(bucket => ({
    date: new Date(parseInt(bucket.startTimeMillis)),
    sleepDuration: bucket.dataset[0]?.point?.reduce((total, point) => {
      const start = nanoToMilli(point.startTimeNanos);
      const end = nanoToMilli(point.endTimeNanos);
      return total + (end - start);
    }, 0) || 0
  }));
};

// Get nutrition data
export const getNutritionData = async (startTime, endTime) => {
  const buckets = await fetchFitnessData('com.google.nutrition', startTime, endTime);
  return buckets.map(bucket => ({
    date: new Date(parseInt(bucket.startTimeMillis)),
    calories: bucket.dataset[0]?.point?.reduce((total, point) => {
      return total + (point.value?.find(v => v.mapKey === 'calories')?.fpVal || 0);
    }, 0) || 0
  }));
};

// Get distance data
export const getDistanceData = async (startTime, endTime) => {
  const buckets = await fetchFitnessData('com.google.distance.delta', startTime, endTime);
  return buckets.map(bucket => ({
    date: new Date(parseInt(bucket.startTimeMillis)),
    distance: bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0
  }));
};

// Get body measurements
export const getBodyData = async (startTime, endTime) => {
  const weightBuckets = await fetchFitnessData('com.google.weight', startTime, endTime);
  const heightBuckets = await fetchFitnessData('com.google.height', startTime, endTime);

  const bodyData = [];

  // Combine weight and height data
  const allDates = new Set([
    ...weightBuckets.map(b => b.startTimeMillis),
    ...heightBuckets.map(b => b.startTimeMillis)
  ]);

  allDates.forEach(dateMillis => {
    const weightBucket = weightBuckets.find(b => b.startTimeMillis === dateMillis);
    const heightBucket = heightBuckets.find(b => b.startTimeMillis === dateMillis);

    bodyData.push({
      date: new Date(parseInt(dateMillis)),
      weight: weightBucket?.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || null,
      height: heightBucket?.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || null
    });
  });

  return bodyData;
};

// Calculate fitness score
export const calculateFitnessScore = (data) => {
  const { steps, heartRate, sleep, calories, distance } = data;

  let score = 0;

  // Steps score (max 30 points)
  if (steps >= 10000) score += 30;
  else if (steps >= 7500) score += 20;
  else if (steps >= 5000) score += 10;

  // Heart rate score (max 20 points) - assuming resting heart rate
  if (heartRate >= 60 && heartRate <= 100) score += 20;
  else if (heartRate >= 50 && heartRate <= 110) score += 15;

  // Sleep score (max 25 points) - assuming sleep in milliseconds
  const sleepHours = sleep / (1000 * 60 * 60);
  if (sleepHours >= 7 && sleepHours <= 9) score += 25;
  else if (sleepHours >= 6 && sleepHours <= 10) score += 15;

  // Calories score (max 15 points) - assuming reasonable daily intake
  if (calories >= 1500 && calories <= 2500) score += 15;
  else if (calories >= 1200 && calories <= 3000) score += 10;

  // Distance score (max 10 points)
  if (distance >= 5) score += 10;
  else if (distance >= 2) score += 5;

  return Math.min(score, 100);
};