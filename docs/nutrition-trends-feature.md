# Nutrition Trends Feature - Implementation Guide

## Overview
The Nutrition Trends feature allows parents to track daily nutritional intake (Protein, Carbs, Fats, Calories) and receive AI-powered insights about the child's nutrition patterns.

## Features Implemented

### 1. **Daily Nutrition Summary**
- Calculates total nutritional values for each day
- Compares against recommended daily intake
- Shows percentage of daily goals met
- Generates personalized insights

### 2. **Weekly Nutrition Trends**
- Tracks 7-day rolling window of nutrition data
- Shows daily breakdown
- Calculates weekly averages
- Identifies eating patterns

### 3. **Monthly Nutrition Analysis**
- Comprehensive monthly overview
- Daily breakdown for the entire month
- Total and average calculations
- Helps identify long-term trends

### 4. **Nutrition Insights & Alerts**
The system generates intelligent insights such as:
- ❌ "Protein intake is low today (25g/50g). Add more eggs, chicken, or dairy!"
- ⚠️ "Carbs are high this week. Balance with proteins and vegetables."
- ✅ "Great protein intake! (65g)"
- ℹ️ "Fats are below recommended level. Include healthy fats like nuts or avocado."

## API Endpoints

### 1. Get Today's Nutrition Summary
```
GET /api/nutrition-trends/today/:profileId
```
**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-05-01",
    "totals": {
      "protein": 45.5,
      "carbs": 250.0,
      "fats": 55.3,
      "calories": 1850.0,
      "fiber": 25.0,
      "water": 2000.0,
      "foodItems": [...]
    },
    "summary": {
      "protein": {
        "value": 45.5,
        "recommended": 50,
        "percentage": 91,
        "unit": "g"
      },
      "carbs": {
        "value": 250.0,
        "recommended": 300,
        "percentage": 83,
        "unit": "g"
      },
      "fats": {
        "value": 55.3,
        "recommended": 65,
        "percentage": 85,
        "unit": "g"
      },
      "calories": {
        "value": 1850.0,
        "recommended": 2000,
        "percentage": 92,
        "unit": "kcal"
      }
    },
    "insights": [
      {
        "type": "info",
        "nutrient": "Protein",
        "message": "Protein intake is good today",
        "severity": "low"
      }
    ],
    "mealsLogged": 5
  }
}
```

### 2. Get Nutrition Summary for Specific Date
```
GET /api/nutrition-trends/daily/:profileId/:date
```
**Parameters:**
- `profileId`: Child's profile ID
- `date`: Date in format YYYY-MM-DD (e.g., 2026-05-01)

### 3. Get This Week's Nutrition Trends
```
GET /api/nutrition-trends/weekly/:profileId
```
**Response includes:**
- Last 7 days of data
- Daily breakdown
- Weekly averages
- Comparison to recommendations

### 4. Get Weekly Nutrition Trends (Specific Week)
```
GET /api/nutrition-trends/weekly/:profileId/:date
```
**Parameters:**
- `profileId`: Child's profile ID
- `date`: End date of the week (YYYY-MM-DD)

### 5. Get This Month's Nutrition Trends
```
GET /api/nutrition-trends/monthly/:profileId
```

### 6. Get Monthly Nutrition Trends (Specific Month)
```
GET /api/nutrition-trends/monthly/:profileId/:month
```
**Parameters:**
- `profileId`: Child's profile ID
- `month`: Month in format YYYY-MM (e.g., 2026-05)

### 7. Compare Nutrition Between Two Dates
```
GET /api/nutrition-trends/compare/:profileId/:startDate/:endDate
```
**Parameters:**
- `profileId`: Child's profile ID
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

## Data Flow

### 1. Adding a Meal
```
Parent adds food via POST /api/meals
├── System stores food with nutrition data (protein, carbs, fats, calories)
└── Data saved to MealLog model with date index
```

### 2. Calculating Daily Totals
```
When requesting nutrition summary:
├── MealLog.findOne({ profileId, date })
├── Sum all food items for all meal types
├── Calculate totals for: protein, carbs, fats, calories, fiber, water
└── Round to 2 decimal places
```

### 3. Generating Insights
```
Based on calculated totals:
├── Compare against DAILY_RECOMMENDATIONS
├── Generate insights for each nutrient:
│   ├── Protein: < 60% = warning, < 80% = info, > 120% = positive
│   ├── Carbs: < 60% = warning, > 130% = info
│   ├── Fats: < 50% = info, > 130% = warning
│   └── Calories: < 70% = info, > 120% = warning
└── Return prioritized insight array
```

## Recommended Daily Intake (Defaults)
```javascript
{
  protein: 50,      // grams
  carbs: 300,       // grams
  fats: 65,         // grams
  calories: 2000    // kcal
}
```
*These can be adjusted based on child's age, weight, and activity level*

## Frontend Integration Example

### Display Today's Summary
```javascript
// Fetch today's nutrition
const response = await fetch(
  `/api/nutrition-trends/today/${profileId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const { data } = await response.json();

// Show visual representation
console.log(`Protein: ${data.summary.protein.percentage}%`);
console.log(`Carbs: ${data.summary.carbs.percentage}%`);
console.log(`Fats: ${data.summary.fats.percentage}%`);
console.log(`Calories: ${data.summary.calories.percentage}%`);

// Show insights
data.insights.forEach(insight => {
  console.log(`[${insight.severity.toUpperCase()}] ${insight.message}`);
});
```

### Display Weekly Chart
```javascript
// Fetch weekly data
const response = await fetch(
  `/api/nutrition-trends/weekly/${profileId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const { data } = await response.json();

// Extract data for charting
const labels = data.daily.map(d => d.date);
const proteinData = data.daily.map(d => d.protein);
const carbsData = data.daily.map(d => d.carbs);
const fatsData = data.daily.map(d => d.fats);
const caloriesData = data.daily.map(d => d.calories);

// Create line chart with this data
```

## Testing the Feature

### 1. Add Test Meals
```bash
curl -X POST http://localhost:5000/api/meals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "profileId": "PROFILE_ID",
    "date": "2026-05-01",
    "mealType": "breakfast",
    "foodItems": [
      {
        "name": "Eggs with Toast",
        "quantity": "2 eggs, 2 slices",
        "protein": 16,
        "carbs": 30,
        "fats": 12,
        "calories": 300,
        "fiber": 3
      }
    ]
  }'
```

### 2. Get Daily Summary
```bash
curl http://localhost:5000/api/nutrition-trends/today/PROFILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Weekly Trends
```bash
curl http://localhost:5000/api/nutrition-trends/weekly/PROFILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Key Files

- **Service:** `backend/services/nutritionTrends.service.js`
  - Core calculation logic
  - Insight generation algorithm
  - Weekly/monthly aggregation

- **Controller:** `backend/controllers/nutritionTrends.controller.js`
  - API endpoint handlers
  - Request validation
  - Response formatting

- **Routes:** `backend/routes/nutritionTrends.routes.js`
  - Endpoint definitions
  - Middleware application
  - Route protection

- **Model:** `backend/models/MealLog.model.js` (existing)
  - Stores daily meal data
  - Contains nutrition fields for each food item

## Security & Permissions

- All endpoints require authentication (`protect` middleware)
- Only parents can access nutrition trends (`authorize('parent')`)
- Ensures data ownership via `checkProfileOwnership` middleware
- Profile must belong to authenticated parent

## Future Enhancements

1. **Customizable Recommendations**
   - Based on child's age, weight, height
   - Based on health conditions (diabetes, allergies, etc.)
   - Based on growth patterns

2. **AI-Powered Meal Suggestions**
   - Suggest meals based on gaps in nutrition
   - Recommend recipes to meet daily targets

3. **Notifications**
   - Alert parent if nutrition falls below threshold
   - Celebrate wins (e.g., "Great protein intake this week!")

4. **Historical Comparison**
   - Compare this week vs. last week
   - Track trends over months

5. **Export/Reports**
   - Generate nutrition reports (PDF/CSV)
   - Share with pediatrician or nutritionist

6. **Machine Learning**
   - Predict nutrition patterns
   - Identify dietary issues early
   - Personalize recommendations based on eating habits
