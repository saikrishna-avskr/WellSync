# WellSync Fitness Dashboard

A modern, interactive fitness dashboard that integrates with Google Fit API to display comprehensive health and fitness metrics.

## Features

- **Google OAuth 2.0 Authentication** with Google Fit API scopes
- **Interactive Dashboard** with multiple widgets:
  - Steps / Physical Activity (Bar Chart)
  - Heart Rate (Line Chart)
  - Sleep Data (Area Chart)
  - Calories / Nutrition (Pie Chart)
  - Distance / Location (Line Chart)
  - Body Measurements (Bar Chart)
- **Date Range Selection** with customizable start and end dates
- **Real-time Data Fetching** from Google Fit API
- **Responsive Design** for mobile and desktop
- **Fitness Score Calculation** based on multiple metrics
- **Weekly/Monthly Summaries**

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **Date Picker**: React DatePicker
- **Google API**: gapi-script
- **Backend**: Python (Flask/FastAPI)

## Google Fit API Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Fit API:
   - Go to "APIs & Services" > "Library"
   - Search for "Fitness API" and enable it

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Select "Web application" as application type
5. Add authorized redirect URIs:
   - For development: `http://localhost:5173` (Vite default)
   - For production: Your deployed domain
6. Copy the Client ID

### 3. Get API Key

1. In "Credentials" page, click "Create Credentials" > "API Key"
2. Copy the API Key

### 4. Configure Environment Variables

Update your `.env` file in the `frontend` directory:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

Replace `your_google_client_id_here` and `your_google_api_key_here` with your actual credentials.

### 5. Update Authorized Origins and Redirect URIs

In Google Cloud Console, make sure your domain is added to:
- Authorized JavaScript origins
- Authorized redirect URIs

## Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   - Update `.env` with your Google API credentials

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Usage

1. Navigate to `/fitness-dashboard` in your application
2. Click "Sign in with Google" to authenticate
3. Grant permissions for Google Fit data access
4. Select date range and click "Fetch Data"
5. View your fitness metrics in the interactive dashboard

## API Scopes Used

The application requests the following Google Fit API scopes:

- `https://www.googleapis.com/auth/fitness.activity.read` - Activity data
- `https://www.googleapis.com/auth/fitness.heart_rate.read` - Heart rate data
- `https://www.googleapis.com/auth/fitness.sleep.read` - Sleep data
- `https://www.googleapis.com/auth/fitness.body.read` - Body measurements
- `https://www.googleapis.com/auth/fitness.nutrition.read` - Nutrition data
- `https://www.googleapis.com/auth/fitness.location.read` - Location/activity data

## Components

### Main Components
- `FitnessDashboard.jsx` - Main dashboard page
- `DateRangeSelector.jsx` - Date selection component

### Widget Components
- `StepsWidget.jsx` - Steps and activity visualization
- `HeartRateWidget.jsx` - Heart rate monitoring
- `SleepWidget.jsx` - Sleep duration tracking
- `NutritionWidget.jsx` - Calorie and nutrition breakdown
- `DistanceWidget.jsx` - Distance traveled
- `BodyWidget.jsx` - Weight and height measurements

### Utilities
- `googleFitApi.js` - Google Fit API integration functions

## Data Visualization

- **Line Charts**: Heart rate over time, distance traveled
- **Bar Charts**: Daily steps, body measurements
- **Area Charts**: Sleep duration
- **Pie Charts**: Nutrition distribution

## Fitness Score Calculation

The fitness score (0-100) is calculated based on:
- Steps (max 30 points)
- Heart rate (max 20 points)
- Sleep duration (max 25 points)
- Calories (max 15 points)
- Distance (max 10 points)

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Error Handling

- API authentication errors
- Data fetching failures
- Invalid date ranges
- Network connectivity issues

## Security

- OAuth 2.0 secure authentication
- API keys stored as environment variables
- No sensitive data stored in local storage
- Secure HTTPS communication with Google APIs

## Troubleshooting

### Common Issues

1. **"Access blocked: This app's request is invalid"**
   - Check your OAuth credentials and authorized domains

2. **"The OAuth client was not found"**
   - Verify your Client ID in the `.env` file

3. **No data showing**
   - Ensure you have Google Fit data for the selected date range
   - Check that you've granted all required permissions

4. **Charts not rendering**
   - Ensure all dependencies are installed: `npm install`
   - Check browser console for JavaScript errors

### Development Tips

- Use browser developer tools to inspect API calls
- Check the Network tab for failed requests
- Verify environment variables are loaded correctly
- Test with different date ranges to ensure data fetching works

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.