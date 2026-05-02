# 🍎 NUTRITION TRENDS FEATURE - QUICK START GUIDE

## ✅ What Was Implemented

### 1️⃣ **Daily Nutrition Tracking**
Parents can now track daily nutrition intake:
- 🥚 **Protein** (target: 50g)
- 🍝 **Carbs** (target: 300g)
- 🥑 **Fats** (target: 65g)
- 🔥 **Calories** (target: 2000 kcal)

### 2️⃣ **Weekly Analysis**
- 📊 7-day rolling window
- 📈 Daily breakdown with averages
- 📋 Track patterns across the week

### 3️⃣ **Monthly Trends**
- 📅 Full month overview
- 📊 Daily-by-daily breakdown
- 📈 Identify long-term patterns

### 4️⃣ **AI-Powered Insights**
System generates smart alerts:
```
❌ "Protein intake is low today (25g/50g). Add more eggs, chicken, or dairy!"
⚠️  "Carbs are high this week (350g/300g). Balance with proteins and vegetables."
✅ "Great protein intake! (65g)"
ℹ️  "Fats are below recommended level. Include healthy fats."
```

---

## 🚀 API ENDPOINTS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nutrition-trends/today/:profileId` | GET | Get today's nutrition summary with insights |
| `/api/nutrition-trends/daily/:profileId/:date` | GET | Get specific date summary (YYYY-MM-DD) |
| `/api/nutrition-trends/weekly/:profileId` | GET | Get this week's trends |
| `/api/nutrition-trends/weekly/:profileId/:date` | GET | Get week ending on date (YYYY-MM-DD) |
| `/api/nutrition-trends/monthly/:profileId` | GET | Get this month's trends |
| `/api/nutrition-trends/monthly/:profileId/:month` | GET | Get specific month (YYYY-MM) |
| `/api/nutrition-trends/compare/:profileId/:startDate/:endDate` | GET | Compare two periods |

---

## 📊 EXAMPLE RESPONSES

### Daily Summary Response
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
      "water": 2000.0
    },
    "summary": {
      "protein": {
        "value": 45.5,
        "recommended": 50,
        "percentage": 91,    // 91% of goal
        "unit": "g"
      },
      "carbs": { "value": 250.0, "recommended": 300, "percentage": 83, "unit": "g" },
      "fats": { "value": 55.3, "recommended": 65, "percentage": 85, "unit": "g" },
      "calories": { "value": 1850.0, "recommended": 2000, "percentage": 92, "unit": "kcal" }
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

### Weekly Trends Response
```json
{
  "success": true,
  "data": {
    "week": {
      "startDate": "2026-04-25",
      "endDate": "2026-05-01",
      "daysLogged": 6,
      "totalDays": 7
    },
    "daily": [
      {
        "date": "2026-04-25",
        "protein": 48.5,
        "carbs": 280.0,
        "fats": 60.0,
        "calories": 1900.0,
        "logged": true
      },
      // ... more days ...
    ],
    "averages": {
      "protein": 47.2,
      "carbs": 290.0,
      "fats": 62.5,
      "calories": 1950.0,
      "fiber": 26.0
    },
    "summary": {
      "protein": { "value": 47.2, "recommended": 50, "percentage": 94, "unit": "g" },
      "carbs": { "value": 290.0, "recommended": 300, "percentage": 97, "unit": "g" },
      "fats": { "value": 62.5, "recommended": 65, "percentage": 96, "unit": "g" },
      "calories": { "value": 1950.0, "recommended": 2000, "percentage": 97, "unit": "kcal" }
    }
  }
}
```

---

## 🔌 HOW IT WORKS (FLOW DIAGRAM)

```
┌─────────────────────────────────────────────────────────────┐
│ Parent adds food via POST /api/meals                         │
│ {                                                            │
│   "profileId": "...",                                        │
│   "date": "2026-05-01",                                      │
│   "mealType": "breakfast",                                   │
│   "foodItems": [{                                            │
│     "name": "Eggs & Toast",                                  │
│     "protein": 16, "carbs": 30,                              │
│     "fats": 12, "calories": 300                              │
│   }]                                                         │
│ }                                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ MealLog saves data for that day                              │
│ Indexed by (profileId, date) for fast retrieval              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Parent requests: GET /api/nutrition-trends/today/:profileId │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ calculateDailyTotals()                                       │
│ ├─ Sum all protein, carbs, fats, calories from all meals   │
│ └─ Return totals                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ getNutritionSummary()                                        │
│ ├─ Calculate percentage: (value / recommended) * 100         │
│ └─ Return with percentages                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ generateInsights()                                           │
│ ├─ IF protein < 60% → "Protein is low"                      │
│ ├─ IF carbs > 130% → "Carbs are high"                       │
│ ├─ IF fats issues → "Adjust fat intake"                     │
│ └─ IF calories issues → "Check calorie intake"              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Return Response:                                             │
│ {                                                            │
│   totals: { protein, carbs, fats, calories, ... },          │
│   summary: { percentages vs targets },                      │
│   insights: [ "Protein low", "Great carbs!", ... ]          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 TESTING IN POSTMAN

### Step 1: Add Food Item
```
POST http://localhost:5000/api/meals
Authorization: Bearer <YOUR_TOKEN>

{
  "profileId": "CHILD_PROFILE_ID",
  "date": "2026-05-01",
  "mealType": "breakfast",
  "foodItems": [
    {
      "name": "Scrambled Eggs",
      "quantity": "2 eggs",
      "protein": 12,
      "carbs": 1,
      "fats": 11,
      "calories": 155,
      "fiber": 0
    },
    {
      "name": "Whole Wheat Toast",
      "quantity": "2 slices",
      "protein": 8,
      "carbs": 24,
      "fats": 1,
      "calories": 160,
      "fiber": 3
    }
  ]
}
```

### Step 2: Get Today's Summary
```
GET http://localhost:5000/api/nutrition-trends/today/CHILD_PROFILE_ID
Authorization: Bearer <YOUR_TOKEN>
```

### Step 3: Get Weekly Trends
```
GET http://localhost:5000/api/nutrition-trends/weekly/CHILD_PROFILE_ID
Authorization: Bearer <YOUR_TOKEN>
```

---

## 📁 FILES CREATED/MODIFIED

```
backend/
├── services/
│   └── nutritionTrends.service.js        [NEW] Core logic
├── controllers/
│   └── nutritionTrends.controller.js     [NEW] Endpoints
├── routes/
│   └── nutritionTrends.routes.js         [NEW] Route definitions
├── app.js                                [MODIFIED] Added route import & usage
└── models/
    └── MealLog.model.js                  [EXISTING] Used for data storage

docs/
└── nutrition-trends-feature.md           [NEW] Full documentation
```

---

## 🔒 SECURITY

✅ All endpoints require:
- Authentication (`protect` middleware)
- Parent role (`authorize('parent')`)
- Profile ownership check (`checkProfileOwnership`)

---

## 🎯 DEFAULT DAILY RECOMMENDATIONS
| Nutrient | Target | Unit |
|----------|--------|------|
| Protein | 50 | g |
| Carbs | 300 | g |
| Fats | 65 | g |
| Calories | 2000 | kcal |

*Can be customized per child based on age, weight, activity level*

---

## 📝 INSIGHT THRESHOLDS

| Nutrient | Condition | Alert Type | Message |
|----------|-----------|-----------|---------|
| **Protein** | < 60% | ❌ Warning | Protein is LOW |
| | < 80% | ℹ️ Info | Protein below target |
| | > 120% | ✅ Positive | Great protein! |
| **Carbs** | < 60% | ❌ Warning | Carbs are LOW |
| | > 130% | ℹ️ Info | Carbs are HIGH |
| **Fats** | < 50% | ℹ️ Info | Fats below target |
| | > 130% | ⚠️ Warning | Fats are HIGH |
| **Calories** | < 70% | ℹ️ Info | Calories low |
| | > 120% | ⚠️ Warning | Calories high |

---

## 🚀 NEXT STEPS

1. **Test the endpoints** using Postman or frontend
2. **Add meals** for several days to see trends
3. **View insights** - check if recommendations match expectations
4. **Customize recommendations** for specific children
5. **Build frontend** UI to display charts and insights

---

## 📚 DETAILED DOCUMENTATION

See `docs/nutrition-trends-feature.md` for:
- Complete API reference
- Data flow explanation
- Frontend integration examples
- Testing procedures
- Future enhancement ideas
