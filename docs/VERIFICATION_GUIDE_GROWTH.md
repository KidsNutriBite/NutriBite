# ✅ Growth Intelligence System Verification Guide

Follow these steps to verify the new Growth Tracking, BMI Calculation, and Risk Alert features.

## 1. Frontend UI Verification (Manual)

### Step 1: Access the Feature
1. **Login** as a **Parent** (e.g., `parent@example.com`).
2. Go to the **Parent Dashboard**.
3. Click on a **Child's Profile** (e.g., "Details" or click the card).
4. You should see a new tab in the profile navigation: **"Growth Timeline"** (with a ruler icon 📏).

### Step 2: Test "Normal" Growth
1. Click the **"Update Growth"** button.
2. Enter valid "Normal" data:
   - **Height**: `110` (cm)
   - **Weight**: `18` (kg)
   - **Notes**: "Checkup"
3. Click **Update Metrics**.
4. **Expected Result**:
   - Modal closes.
   - The "Current BMI" widget updates (BMI should be **~14.9**).
   - A **Green "Normal" badge** appears.
   - The graph shows a data point.

### Step 3: Test "High Risk" Growth (Doctor Alert)
1. Click **"Update Growth"** again.
2. Enter "Obese" range data:
   - **Height**: `110` (cm)
   - **Weight**: `30` (kg)
   - **Notes**: "Weight jumped recently"
3. Click **Update Metrics**.
4. **Expected Result**:
   - The "Current BMI" widget updates (BMI **~24.8**).
   - A **Red "Obese" badge** appears.
   - (Backend) A notification is generated for any linked doctors.

### Step 4: Verify History & Visualization
1. Scroll down to the **Growth Trends** chart.
2. Hover over the dots to see the tooltips showing Percentile and BMI.
3. Scroll down to the **History Records** list to see the log of both entries.

---

## 2. Backend API Verification (Optional)

If you want to verify the API directly without the UI:

### Update Growth (POST)
```bash
curl -X POST http://localhost:5000/api/growth/update/<CHILD_ID> \
  -H "Authorization: Bearer <PARENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"height": 115, "weight": 20, "notes": "API Test"}'
```

### Get History (GET)
```bash
curl -X GET http://localhost:5000/api/growth/<CHILD_ID> \
  -H "Authorization: Bearer <PARENT_TOKEN>"
```

---

## 3. Data Integrity Check

Checks performed by the system:
- **BMI Calculation**: `Weight / (Height/100)²`
- **Percentile**: Calculated based on age-adjusted WHO-style ranges.
- **Risk Flag**: 
  - BMI < 5th % → Underweight
  - BMI > 85th % → Overweight
  - BMI > 95th % → Obese
