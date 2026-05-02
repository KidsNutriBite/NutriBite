# 🏗️ NUTRITION TRENDS - ARCHITECTURE DIAGRAM

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vue)                             │
│  Displays charts, insights, daily/weekly/monthly nutrition summaries    │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ HTTP Requests
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER (Security)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ protect (Auth) → authorize (Role) → checkProfileOwnership       │   │
│  │ Ensures: User is logged in, is parent, owns the profile        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API ROUTES LAYER                                      │
│  (/api/nutrition-trends/)                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ GET /today/:profileId              → getTodayNutritionSummary  │   │
│  │ GET /daily/:profileId/:date        → getDailyNutritionSummary  │   │
│  │ GET /weekly/:profileId             → getThisWeekTrends         │   │
│  │ GET /weekly/:profileId/:date       → getWeeklyTrends           │   │
│  │ GET /monthly/:profileId            → getThisMonthTrends        │   │
│  │ GET /monthly/:profileId/:month     → getMonthlyTrends          │   │
│  │ GET /compare/:startDate/:endDate   → compareNutritionPeriods   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             CONTROLLER LAYER (nutritionTrends.controller.js)            │
│  Handles HTTP requests & responses, calls service layer                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ validateInput() → fetchData() → processData() → sendResponse() │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            SERVICE LAYER (nutritionTrends.service.js)                   │
│  Core business logic for nutrition calculations & insights             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ calculateDailyTotals()                                          │   │
│  │   └─ Sum: protein, carbs, fats, calories, fiber, water        │   │
│  │                                                                 │   │
│  │ getNutritionSummary()                                          │   │
│  │   └─ Calculate percentages: (value/recommended) * 100         │   │
│  │                                                                 │   │
│  │ generateInsights()                                             │   │
│  │   ├─ IF protein < 60% → "Protein is low"                      │   │
│  │   ├─ IF carbs > 130% → "Carbs are high"                       │   │
│  │   ├─ IF fats issues → "Adjust fats"                           │   │
│  │   └─ IF calories issues → "Watch calories"                    │   │
│  │                                                                 │   │
│  │ getWeeklyTrends() → Aggregates 7 days data                    │   │
│  │ getMonthlyTrends() → Aggregates full month data               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (MongoDB)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Collection: MealLog                                             │   │
│  │ {                                                               │   │
│  │   profileId: ObjectId,                                          │   │
│  │   date: "2026-05-01",                                           │   │
│  │   breakfast: [ {name, protein, carbs, fats, calories, ...} ],  │   │
│  │   lunch: [ {name, protein, carbs, fats, calories, ...} ],      │   │
│  │   dinner: [ {name, protein, carbs, fats, calories, ...} ],     │   │
│  │   ...                                                           │   │
│  │ }                                                               │   │
│  │                                                                 │   │
│  │ Index: { profileId: 1, date: 1 } (unique)                     │   │
│  │ Fast queries: O(1) lookup for profileId + date                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Processing Pipeline

```
Input: MealLog Document
│
├─ EXTRACT FOOD ITEMS
│  ├─ breakfast: [{protein: 12, carbs: 30, fats: 5, calories: 200}, ...]
│  ├─ lunch: [{protein: 25, carbs: 45, fats: 8, calories: 400}, ...]
│  └─ dinner: [{protein: 30, carbs: 50, fats: 10, calories: 500}, ...]
│
├─ CALCULATE TOTALS
│  ├─ protein: 12 + 25 + 30 = 67g
│  ├─ carbs: 30 + 45 + 50 = 125g
│  ├─ fats: 5 + 8 + 10 = 23g
│  └─ calories: 200 + 400 + 500 = 1100 kcal
│
├─ GET PERCENTAGES
│  ├─ protein: (67 / 50) * 100 = 134%
│  ├─ carbs: (125 / 300) * 100 = 42%
│  ├─ fats: (23 / 65) * 100 = 35%
│  └─ calories: (1100 / 2000) * 100 = 55%
│
├─ GENERATE INSIGHTS
│  ├─ protein > 120% → ✅ "Great protein intake!"
│  ├─ carbs < 60% → ❌ "Carbs are low today"
│  ├─ fats < 50% → ℹ️ "Include healthy fats"
│  └─ calories < 70% → ℹ️ "Make sure child eats enough"
│
└─ RETURN RESPONSE
   {
     date: "2026-05-01",
     totals: { protein: 67, carbs: 125, fats: 23, calories: 1100 },
     summary: {
       protein: { value: 67, recommended: 50, percentage: 134 },
       carbs: { value: 125, recommended: 300, percentage: 42 },
       fats: { value: 23, recommended: 65, percentage: 35 },
       calories: { value: 1100, recommended: 2000, percentage: 55 }
     },
     insights: [
       { type: "positive", message: "Great protein!" },
       { type: "warning", message: "Carbs are low" },
       { type: "info", message: "Include healthy fats" },
       { type: "warning", message: "Increase calories" }
     ]
   }
```

---

## Weekly Aggregation Logic

```
Week: May 1-7, 2026

Day 1 (May 1):  protein: 50, carbs: 280, fats: 65, calories: 1900
Day 2 (May 2):  protein: 48, carbs: 290, fats: 60, calories: 1850
Day 3 (May 3):  protein: 55, carbs: 310, fats: 70, calories: 2050
Day 4 (May 4):  protein: 45, carbs: 260, fats: 58, calories: 1750
Day 5 (May 5):  protein: 52, carbs: 300, fats: 68, calories: 1950
Day 6 (May 6):  protein: 49, carbs: 295, fats: 62, calories: 1900
Day 7 (May 7):  (no data)

CALCULATION:
Days logged: 6

Averages:
├─ protein: (50+48+55+45+52+49) / 6 = 299 / 6 = 49.83g
├─ carbs: (280+290+310+260+300+295) / 6 = 1735 / 6 = 289.17g
├─ fats: (65+60+70+58+68+62) / 6 = 383 / 6 = 63.83g
└─ calories: (1900+1850+2050+1750+1950+1900) / 6 = 11400 / 6 = 1900 kcal

Percentages (vs daily targets):
├─ protein: (49.83 / 50) * 100 = 99.66%
├─ carbs: (289.17 / 300) * 100 = 96.39%
├─ fats: (63.83 / 65) * 100 = 98.2%
└─ calories: (1900 / 2000) * 100 = 95%

INSIGHTS:
✅ Excellent week! All nutrients are at 95-99% of targets
💡 Very consistent nutrition across the week
```

---

## Insight Generation Logic

```
INSIGHT RULES:

PROTEIN:
├─ percentage < 60% → type: "warning", severity: "high"
│  message: "Protein intake is low. Add eggs, chicken, or dairy!"
├─ 60% ≤ percentage < 80% → type: "info", severity: "medium"
│  message: "Protein below target. Consider protein-rich foods."
├─ 80% ≤ percentage ≤ 120% → NO INSIGHT (normal range)
└─ percentage > 120% → type: "success", severity: "low"
   message: "Great protein intake!"

CARBS:
├─ percentage < 60% → type: "warning", severity: "high"
│  message: "Carbs are low. Add whole grains or fruits!"
├─ 60% ≤ percentage ≤ 130% → NO INSIGHT (normal range)
└─ percentage > 130% → type: "info", severity: "medium"
   message: "Carbs are high. Balance with proteins and vegetables."

FATS:
├─ percentage < 50% → type: "info", severity: "low"
│  message: "Fats below recommended. Include healthy fats like nuts."
├─ 50% ≤ percentage ≤ 130% → NO INSIGHT (normal range)
└─ percentage > 130% → type: "warning", severity: "medium"
   message: "Fat intake is high. Opt for leaner options."

CALORIES:
├─ percentage < 70% → type: "info", severity: "medium"
│  message: "Calories are low. Ensure child is eating enough."
├─ 70% ≤ percentage ≤ 120% → NO INSIGHT (normal range)
└─ percentage > 120% → type: "warning", severity: "medium"
   message: "Calories are high. Watch portion sizes."
```

---

## Request/Response Flow Example

### Request
```
GET /api/nutrition-trends/today/507f1f77bcf86cd799439011
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

### Processing
```
1. Route Handler → nutritionTrendsRoutes.js
2. Middleware Check → protect() → verify JWT token
3. Middleware Check → authorize('parent') → check user role
4. Middleware Check → checkProfileOwnership() → verify profile belongs to user
5. Controller Call → getTodayNutritionSummary()
6. Service Call → calculateDailyTotals()
7. Service Call → getNutritionSummary()
8. Service Call → generateInsights()
9. Format Response → ApiResponse()
10. Send Response → 200 OK
```

### Response
```json
{
  "success": true,
  "data": {
    "date": "2026-05-01",
    "totals": {
      "protein": 67.5,
      "carbs": 280.0,
      "fats": 65.2,
      "calories": 1950.0,
      "fiber": 28.0,
      "water": 2100.0
    },
    "summary": {
      "protein": {
        "value": 67.5,
        "recommended": 50,
        "percentage": 135,
        "unit": "g"
      },
      "carbs": {
        "value": 280.0,
        "recommended": 300,
        "percentage": 93,
        "unit": "g"
      },
      "fats": {
        "value": 65.2,
        "recommended": 65,
        "percentage": 100,
        "unit": "g"
      },
      "calories": {
        "value": 1950.0,
        "recommended": 2000,
        "percentage": 97,
        "unit": "kcal"
      }
    },
    "insights": [
      {
        "type": "success",
        "nutrient": "Protein",
        "message": "Great protein intake! (67.5g)",
        "severity": "low"
      },
      {
        "type": "info",
        "nutrient": "Carbs",
        "message": "Carbs at 93% of target. Great balance!",
        "severity": "low"
      }
    ],
    "mealsLogged": 5
  },
  "message": "Today's nutrition summary fetched successfully"
}
```

---

## File Structure

```
backend/
├── services/
│   └── nutritionTrends.service.js
│       ├── calculateDailyTotals(mealLog)
│       ├── getNutritionSummary(totals)
│       ├── generateInsights(summary)
│       ├── getWeeklyTrends(profileId, endDate)
│       ├── getMonthlyTrends(profileId, month)
│       └── DAILY_RECOMMENDATIONS
│
├── controllers/
│   └── nutritionTrends.controller.js
│       ├── getDailyNutritionSummary()
│       ├── getTodayNutritionSummary()
│       ├── getWeeklyNutritionTrends()
│       ├── getThisWeekNutritionTrends()
│       ├── getMonthlyNutritionTrends()
│       ├── getThisMonthNutritionTrends()
│       └── compareNutritionPeriods()
│
├── routes/
│   └── nutritionTrends.routes.js
│       ├── GET /today/:profileId
│       ├── GET /daily/:profileId/:date
│       ├── GET /weekly/:profileId
│       ├── GET /weekly/:profileId/:date
│       ├── GET /monthly/:profileId
│       ├── GET /monthly/:profileId/:month
│       └── GET /compare/:profileId/:startDate/:endDate
│
├── models/
│   └── MealLog.model.js (EXISTING - Used for storage)
│
└── app.js (MODIFIED - Added nutrition trends route)

docs/
├── nutrition-trends-feature.md (Complete documentation)
└── NUTRITION_TRENDS_QUICK_GUIDE.md (Quick reference)
```

---

## Performance Optimization

```
INDEXING STRATEGY:
┌─────────────────────────────────────────────┐
│ MealLog Collection Indexes                  │
├─────────────────────────────────────────────┤
│ { profileId: 1, date: 1 } → UNIQUE INDEX   │
│   └─ O(1) lookups for specific dates       │
│   └─ Fast range queries for date ranges    │
└─────────────────────────────────────────────┘

QUERY OPTIMIZATION:
├─ Daily query: O(1) → Direct lookup
├─ Weekly query: O(7) → Range query on indexed fields
├─ Monthly query: O(30) → Range query on indexed fields
└─ No N+1 queries → All food items in single document

CACHING POTENTIAL:
├─ Cache daily summaries for 1 hour
├─ Cache weekly trends for 6 hours
└─ Invalidate on new meal entry
```
