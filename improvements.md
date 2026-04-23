# System Improvements & Task List

This document outlines the pediatrician-requested improvements and the updated system architecture for **NutriKid – AI-Powered Pediatric Nutrition Intelligence Platform**.

---

## 📋 Task List

### 1. Authentication & User Profile Changes
- [x] **1.1 Parent Registration Improvements**
  - Add "Relationship with Child" field (Mother, Father, Guardian, Caretaker).
- [x] **1.2 Login Session UX**
  - Update login message to: *"Stay logged in to receive health updates and reminders for your child."*
- [x] **1.3 Child Profile Creation**
  - Make the following fields mandatory: Date of Birth (DOB), Gender, Initial Height, Initial Weight, Waist Circumference.
  - Automatically calculate child's age from DOB and prevent manual age input.
  - Automate birthday wishes display based on DOB.

### 2. Parent Dashboard Improvements
- [x] **2.1 Update "Recently Checked" Section**
  - Replace current view with "Last Pediatrician Checkup" displaying: Date, Time, Doctor Name.
- [x] **2.2 Complete Checkup History**
  - Add a view for parents to see past checkups including: Date, Doctor, Notes, Diagnosis, Prescription.
- [x] **2.3 Growth Timeline Visualization**
  - Implement visual growth tracking timeline with height/weight growth animations and milestone icons (e.g., Infant, Growing, Active, Healthy Growth).
- [x] **2.4 Child Health Avatar**
  - Instead of standard charts, show a growing animated character reflecting health states (e.g., Weak energy, Healthy, Strong, Overweight) so kids and parents understand health visually.
- [x] **2.5 Waist Circumference Tracking**
  - Add "Waist Circumference (cm)" input and incorporate it into growth charts and risk analysis.
- [x] **2.6 90-Day Growth Reminder**
  - Enforce parent requirement to update height + weight every 90 days.
  - Send notifications (e.g., *"Reminder: 2 days left to update your child’s growth details."*).
- [x] **2.7 Growth Timeline – BMI Status Panel & Waist Circumference in Chart**
  - Show a BMI status info panel: current category (Underweight/Normal/Overweight/Obese) with recommended BMI range and recommended waist circumference for child's age.
  - Plot waist circumference as a third line in the growth chart.
  - Show Height, Weight, BMI, and Waist Circumference as stat cards in summary.
  - Improve the Delete button style on history records.
- [x] **2.8 Nutrition Trends – Calorie & Macronutrient Charts**
  - Add a calorie intake trend line chart (daily calories over last 14 days).
  - Add a macronutrient breakdown bar chart (Protein / Carbs / Fats per day).

### 3. Meal Logging Improvements
- [ ] **3.1 Time Gap Between Meals**
  - Automatically calculate and display the time since the previous meal for meal pattern analysis.
- [ ] **3.2 Snack Logging Improvement**
  - Expand snack options to: Morning Snack, Afternoon Snack, Evening Snack.
- [ ] **3.3 Default Meal Times**
  - Provide editable default times: Breakfast (8:00 AM), Lunch (1:00 PM), Dinner (8:00 PM).
- [ ] **3.4 Food Quantity Input**
  - Allow specifying quantity for each food item (e.g., `[-] 100 g [+]`), with reasonable defaults.
- [ ] **3.5 Portion Size Education**
  - Display practical equivalents when an item is selected (e.g., *100 g rice ≈ 1 cup*, *1 glass milk ≈ 250 ml*).
- [ ] **3.6 Food Image Recognition**
  - Add "Upload Food Photo" option for AI-based automatic food detection (e.g., using YOLOv8 or Food101 dataset), falling back to manual selection if it fails.
- [ ] **3.7 Nutritional Data Expansion**
  - Expand nutrient tracking beyond Calories, Carbs, Protein to include: Fiber, Water content, Vitamins, Minerals.
- [ ] **3.8 Remove Duplicate BMI**
  - Remove BMI display from the meal log screen (already visible in Dashboard Overview).
- [ ] **3.9 AI Meal Feedback (Real-Time)**
  - Instantly provide interactive feedback when food is logged (e.g., "This meal is rich in carbohydrates and protein. However, it lacks vegetables and fiber. Consider adding spinach or carrots.").

### 4. Smart Nutrition Analyzer 
*(Note: Move this to a separate sidebar section)*
- [ ] **4.1 Multi-Time Analysis**
  - Analyze diets on Daily, Weekly, Monthly, and Yearly scales.
- [ ] **4.2 Nutrient Deficiency Detection**
  - Track Macronutrients (Protein, Carbs, Fats) and Micronutrients (Iron, Zinc, Magnesium, Vitamins B/D, Calcium, Fiber, Water).
- [ ] **4.3 Diet Gap Detection**
  - Provide human-readable outputs (e.g., *"Iron intake below recommended levels"*).
- [ ] **4.4 AI Diet Plan Generation**
  - Generate next-week diet suggestions using frequently logged foods and local availability. 
  - Provide reasoning (e.g., *"Spinach added to lunch - High iron content to correct deficiency"*).
- [ ] **4.5 Predictive Nutrition Risk (High Impact)**
  - Shift from reactive to preventive healthcare by predicting future nutrient risks before they happen.
  - Track nutrients daily, compare with recommended intake, and use trend prediction (e.g., *"If current diet continues, the child may develop iron deficiency in 4 weeks."*).
- [ ] **4.6 Indian Food Intelligence**
  - Specialize in analyzing Indian diets (e.g., Idli, Dosa, Chapati, Dal, Paneer, Upma).
  - Use data from the Indian Council of Medical Research (ICMR) and National Institute of Nutrition (NIN).
- [ ] **4.7 Smart Grocery Suggestions**
  - Convert deficiency analysis into a real-action shopping list (e.g., if child needs iron, suggest buying Spinach, Beetroot, Dates, Jaggery).
- [ ] **4.8 Weekly Nutrition Score**
  - Gamify nutrition by providing a score out of 100 based on the week's diet, showing what's good and what needs improvement.
- [ ] **4.9 Digital Nutrition Twin (Research-Level Feature)**
  - Create a health profile simulation for the child showing future growth trajectories if the diet improves versus if it remains the same.

### 5. Sunlight & Supplements Tracking
- [ ] **5.1 Sun Exposure Input**
  - Allow logging of Sun Exposure (Duration in Morning/Afternoon/Evening) and estimate Vitamin D intake.
- [ ] **5.2 Supplement Tracking**
  - Add tracking for supplements (e.g., Vitamin tablets, Iron syrup, Calcium) and include them in nutritional calculations.

### 6. Multi-Child Support
- [ ] **6.1 Multi-Child Dashboard**
  - Add a Child Profile Selector so each child has separate diet, growth, and deficiency tracking.
- [ ] **6.2 Combined Diet Planning**
  - Add option to "Generate common meal plan for all children" to simplify parent cooking efforts.

### 7. AI Safety & Medical Reliability
- [ ] **7.1 Add Medical Disclaimer**
  - Display disclaimer: *"This system provides nutritional guidance based on medical guidelines. It is not a substitute for professional medical advice. Consult your pediatrician for serious health concerns."*
- [ ] **7.2 Source Citations & Explainable AI**
  - Ensure AI responses clearly output their sources (e.g., ICMR Pediatric Nutrition Guidelines, NIN).
  - The AI must explicitly explain WHY a food is recommended (e.g., "Spinach is recommended because Iron = 2.7 mg per 100g") to build parent and physician trust.
- [ ] **7.3 Community Knowledge Learning & Flagging**
  - Allow parents to flag wrong AI answers.
  - Implement a feedback loop: Parent flags answer → Admin review → Update knowledge base. This makes the system self-improving.
- [ ] **7.4 Pediatrician Escalation**
  - Trigger immediate UI alerts for serious risks (e.g., *"Consult your pediatrician immediately."*) and suggest doctor connection.

### 8. Feedback System
- [ ] **8.1 Add Feedback Page**
  - Implement a dedicated page for parents to submit suggestions, bugs, and feature requests.

### 9. Onboarding Questionnaire
- [ ] **9.1 Initial Survey**
  - Ask users reason for use during onboarding (e.g., Improve child's diet, Track growth, Doctor recommendation).
- [ ] **9.2 Goal Setting**
  - Allow parents to set Motivation Goals (e.g., Improve immunity, Healthy weight, Balanced diet).

### 10. Kids Mode Improvements
- [ ] **10.1 AI Nutrition Tutor for Kids**
  - Update AI prompts so it answers in engaging story formats (e.g., "Once there was a superhero called Iron Kid. He ate spinach to become strong...").
- [ ] **10.2 Explain Good vs Bad Food**
  - Ensure the AI explains the *why* behind food healthiness and moderation.
- [ ] **10.3 Make Chat More Interactive**
  - Add characters, storytelling elements, and interactive animations.

### 11. Doctor Dashboard Enhancements
- [ ] **11.1 Doctor AI Assistant**
  - Help doctors analyze diets quickly by providing an AI summary of a patient's diet patterns and specific risks (e.g., "Child: 6 years old. Diet pattern: Low vegetables. Risk: Iron deficiency").

---

## 🏗️ Updated Project Specification & Architecture

**Project Name:** NutriKid – India’s AI Pediatric Nutrition Intelligence System
*Unique Selling Point: Combining biomedical LLMs, RAG, Indian diet databases, predictive nutrition analytics, and gamified learning.*

### Updated AI Architecture (Important)
- **Model Shift:** Transition from a general LLM to a **Biomedical LLM + RAG** approach.
  - **Recommended Models:** BioMistral 7B or PubMedBERT
  - **Hardware/Hosting:** Google Colab T4 GPU
- **Data Flow Pipeline:**
  Parent logs meal → Backend stores data → Nutrition Analyzer processes data → Biomedical LLM + RAG → Deficiency analysis → Diet suggestions → Doctor alerts

### Updated Core Modules
1. **Authentication Module:** Handles Parent login, Doctor login, and Child profiles.
2. **Growth Monitoring Module:** Tracks Height, Weight, Waist circumference, and Growth timeline.
3. **Meal Logging System:** Features Meal/Snack tracking, Food quantity, and Image recognition.
4. **Smart Nutrition Analyzer:** AI system that Detects deficiencies, Tracks nutrients, and Predicts risk.
5. **Pediatric AI Assistant:** 
   - **Parent Mode:** Nutritional advice, Deficiency explanations
   - **Kids Mode:** Story-based chat, Nutrition education
6. **Doctor Dashboard:** Doctors can view growth data, check deficiencies, monitor patients, and give prescriptions.

### Updated Technology Stack
- **Frontend:** React, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, MongoDB
- **AI Layer:** Python, FastAPI, BioMistral / PubMedBERT, FAISS Vector DB, SentenceTransformers
- **RAG Knowledge Sources:** ICMR Nutritional Guidelines, NIN Food Database, WHO Child Growth Standards, Pediatric Nutrition Textbooks

### Project Impact
NutriKid demonstrates how domain-adapted biomedical LLMs with RAG can be used safely in healthcare applications to:
- Improve pediatric nutrition awareness.
- Detect hidden deficiencies early.
- Support parents in making better dietary decisions.
- Assist pediatricians with structured patient data.
