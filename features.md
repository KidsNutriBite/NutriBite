# NutriBite - Complete Feature Specification

NutriBite is an AI-powered pediatric nutrition and clinical oversight platform that bridges the gap between parents, children, and pediatricians. Below is the list of complete features currently implemented in the system.

---

## 1. Parent Dashboard & Child Profiles

### 👤 Profile Management
* **Multi-Child Profiles**: Parents can create and manage separate child profiles with age, date of birth, gender, height, and weight.
* **Fun Avatars**: Interactive animal avatars selection (🦁 Lion, 🐻 Bear, 🐰 Rabbit, 🦊 Fox, 🐱 Cat, 🐶 Dog) representing the child's Food Buddy.
* **XP and Level System**: Displays the child's level and experience points (XP) based on healthy logging habits.

### 🥗 Meal & Nutrition Journal
* **6 Daily Meal Slots**: Parents can log foods across Breakfast, Morning Snack, Lunch, Afternoon Snack, Evening Snack, and Dinner.
* **115+ Indian Foods Library**: Searchable database populated with calories, proteins, carbohydrates, fats, fiber, vitamins, and water metrics.
* **Interactive Meal Cards**: Shows food items, portion quantities, and individual meal calorie summaries.
* **Photo Upload**: Supports uploading photos of cooked meals to attach to daily meal logs.

### 💧 Quick Dashboard Water Logging
* **Stats Card Logger**: A direct "+ 250ml Glass" button on the dashboard's Water Intake card. Parents can quickly log water consumption with a single click.
* **Water Quick-Add**: A quick-select "Water" chip (💧) inside the log meal form for fast logging.

### 😴 Sleep Tracking
* **Daily Sleep Logging**: Easy input form for recording sleep and wake times, including sleep notes.
* **Sleep Health Assessment**: Evaluates sleep durations automatically and flags statuses:
  - `Poor Sleep` (under 8 hours)
  - `Healthy` (8 to 10 hours)
  - `Oversleep` (over 10 hours)
  - `No data` (if no sleep entry is recorded yet)

### 🏃‍♂️ Activity Tracking
* **Physical Activity Log**: Record daily exercise, outdoor play, or sports routines.
* **Duration Metrics**: Logs activity types and hours active to compute overall fitness.

### 🔥 Gamification & Engagement Streaks
* **Meal Logging Streak**: Tracks consecutive daily meal logging events to build habit loops.
* **Sleep Logging Streak**: Monitors consecutive daily sleep entries.
* **Physical Activity Streak**: Tracks consecutive daily exercise logs.
* **Hydration Streak**: Tracks consecutive days where the child reaches the target water consumption (>= 1.5 Liters / 1500ml).

---

## 2. Doctor Portal & Clinical Oversight

### 🩺 Access Authorization (Secure Handshake)
* **Email Access Requests**: Doctors request profile access by submitting the parent's email.
* **Two-Level RBAC Access**:
  - `Restricted View`: Access to basic details (age, height, weight) and parent-provided consultation messages.
  - `Full Access`: Access to the child's clinical history, growth analytics, and Vector-RAG twin.

### 📈 Growth Velocity Center
* **BMI Tracking**: Logs and calculates child BMI against risk categories (`underweight`, `normal`, `overweight`, `obese`).
* **Velocity Analysis**: FastAPI AI service analyzes monthly growth trends, drift directions, and risk alerts.
* **Pediatrician Safety Warnings**: Automatic banner alert to consult a doctor if severe nutrient deficiency or high BMI risk is observed.

### 📝 Clinical Prescriptions & Countdown Timers
* **Electronic Prescriptions**: Doctors can write diagnostic advice, notes, and instructions directly linked to the child.
* **Custom Checkup Timers**: Doctors can set custom next-checkup intervals (e.g. 60 or 90 days).
* **Parent Countdown Card**: Shows a timeline warning on the parent dashboard: `Still X days left for next checkup` based on clinical intervals.

---

## 3. Advanced AI & RAG Capabilities

### 💬 NutriGuide Chat
* **RAG Retrieval**: Combines BM25 lexical keyword matching and FAISS dense vector search over clinical pediatric guidelines (ICMR/NIN guidelines).
* **Clinical Layout Toggle**: Prompt filters allow parents to toggle `|||DETAILED|||` views to switch between user-friendly summaries and clinical source contexts.
* **Allergen Filter Shield**: Deterministic python code blocks any meal ideas containing child allergens prior to sending prompts to the LLM.

### 🤖 Digital Twin View
* **Simulated Avatar**: Generates a physical twin representation of the child.
* **Predictive Diagnostics**: Simulates the effects of current dietary habits, forecasting developmental progress and macro targets over time.

---

## 4. Grocery Insights & Cart Shopping

### 🛒 Shopping List Integration
* **Nutrition Insights Cart**: Highlights nutritional gaps (e.g. iron deficiency) and recommends a list of healthy grocery items.
* **Add to Cart Actions**: Parents can toggle recommendations into a grocery cart checklist.
* **List Downloader**: A "Download List" utility exports the cart items to a text file (`nutribite-grocery-cart-[profileId].txt`) for offline shopping.
