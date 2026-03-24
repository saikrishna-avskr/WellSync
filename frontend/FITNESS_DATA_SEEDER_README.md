# Fitness Data Seeder

A utility page to help populate Google Fit data for testing the Fitness Dashboard.

## Overview

The Google Fit REST API has limitations - it primarily allows **reading** fitness data, not **writing/inserting** it. This is a security measure by Google to prevent unauthorized data manipulation.

## What This Page Does

- **Explains API Limitations**: Clearly communicates why automatic data insertion isn't possible
- **Provides Manual Methods**: Guides users on how to add test data manually
- **Quick Links**: Direct links to Google Fit web and mobile apps
- **Sample Data Ideas**: Suggests realistic test data to add

## How to Add Test Data

### Method 1: Google Fit Mobile App (Recommended)

1. **Download Google Fit**: Install from Google Play Store or App Store
2. **Sign In**: Use the same Google account as your dashboard
3. **Add Activities**:
   - Tap the "+" button
   - Choose "Add activity"
   - Select type (Walk, Run, etc.)
   - Set duration and distance
4. **Add Meals**:
   - Tap "Nutrition" tab
   - Add breakfast, lunch, dinner
   - Enter calorie counts
5. **Add Measurements**:
   - Go to profile/settings
   - Add weight and height

### Method 2: Google Fit Web Interface

1. **Visit**: [fit.google.com](https://fit.google.com)
2. **Sign In**: Same Google account
3. **Manual Entry**: Click "Add Data" or use the journal
4. **Add Activities**: Walking, running, cycling
5. **Log Meals**: Breakfast, lunch, dinner with calories

### Method 3: Connect Wearables/Apps

1. **Smartwatch**: Connect Garmin, Fitbit, Apple Watch
2. **Phone Sensors**: Enable motion & fitness tracking
3. **Third-party Apps**: MyFitnessPal, Strava, etc.

## Sample Test Data to Add

### Daily Activity (Repeat for 7 days)
- **Steps**: 8,000-12,000 steps
- **Distance**: 5-8 km
- **Active Minutes**: 30-60 minutes

### Heart Rate (2-3 readings per day)
- **Morning**: 60-75 BPM (resting)
- **Afternoon**: 70-85 BPM
- **Evening**: 65-80 BPM

### Sleep (Nightly)
- **Duration**: 7-9 hours
- **Bedtime**: 10:00 PM - 11:00 PM
- **Wake time**: 6:00 AM - 7:00 AM

### Nutrition (Daily meals)
- **Breakfast**: 300-500 calories
- **Lunch**: 500-700 calories
- **Dinner**: 400-600 calories
- **Total**: 1,800-2,500 calories

### Body Measurements
- **Weight**: Your current weight (kg)
- **Height**: Your height (cm) - usually one-time entry

## Testing the Dashboard

After adding data:

1. **Wait for Sync**: Data may take a few minutes to sync
2. **Refresh Dashboard**: Click "Fetch Data" in the dashboard
3. **Check Charts**: Verify all widgets show data
4. **Adjust Date Range**: Test different time periods

## Troubleshooting

### Data Not Showing
- **Wait**: Google Fit sync can take 5-15 minutes
- **Refresh**: Hard refresh the dashboard (Ctrl+F5)
- **Check Account**: Ensure same Google account in both places

### Permission Issues
- **Re-authorize**: Sign out and sign back in to dashboard
- **Check Scopes**: Ensure all fitness scopes are granted

### App Not Syncing
- **Force Sync**: Open Google Fit app → Settings → Force sync
- **Restart App**: Close and reopen Google Fit
- **Check Internet**: Ensure stable connection

## Alternative Testing Methods

If manual data entry is too time-consuming:

### 1. Use Existing Data
- If you have a fitness tracker, let it sync real data
- Use historical data if available

### 2. Demo Mode (Development)
- Modify the dashboard to show mock data for demos
- Create a toggle for "Demo Mode" vs "Real Data"

### 3. Third-party Tools
- Fitness data generators (limited options)
- Import from other fitness platforms

## Security Note

⚠️ **Important**: The data seeder page explains limitations because Google intentionally restricts write access to fitness data through APIs. This prevents:
- Unauthorized data manipulation
- Privacy violations
- Data integrity issues

Manual entry through official Google interfaces ensures data authenticity and user control.

## Links

- **Fitness Dashboard**: `/fitness-dashboard`
- **Google Fit Web**: [fit.google.com](https://fit.google.com)
- **Google Fit App**: [Play Store](https://play.google.com/store/apps/details?id=com.google.android.apps.fitness)
- **API Documentation**: [Google Fit API](https://developers.google.com/fit)