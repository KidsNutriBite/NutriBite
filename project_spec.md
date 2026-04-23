# Project Specification Document

## 1. Cover Page

**Project Title:** NutriKid – Doctor-Guided Pediatric Nutrition Platform  
**Client Name / Organization:** Pediatric Care Clinics & Network  
**Submitted By:**  
- Person 1 (Project Manager)  
- Person 2 (Frontend Developer)  
- Person 3 (Backend Engineer)  
- Person 4 (AI/ML Developer)  
- Person 5 (Database & QA Analyst)  

**Institution / Course Name:** [Insert Institution/Course Name]  
**Date of Submission:** March 10, 2026  

*(Assigned to: Person 1)*

---

## 2. Abstract / Executive Summary

**Background of problem:**
Monitoring and managing a child's nutrition and growth is often a disjointed process. Parents lack an integrated way to securely log meals or understand micronutrient deficiencies, while pediatricians struggle with inaccurate, unstructured self-reported data from parents during routine checkups. Additionally, children often lack the motivation to make healthy eating choices.

**Proposed solution:**
NutriKid is a holistic, full-stack application (MERN stack integrated with a dedicated Python/FastAPI AI engine) designed to bridge the data gap between parents and healthcare providers while gamifying healthy eating for children. 

**Main functionality:**
The system features three distinct portals:
1. **Parent Command Center**: For tracking child growth metrics (BMI, height, weight), logging meals, and communicating securely with verified doctors.
2. **Doctor Dashboard**: For reviewing connected patients' dietary histories, receiving automated AI risk flags, and issuing digital prescriptions.
3. **Gamified Kids Mode**: Features a superhero-themed "Food Buddy" AI companion built on Mistral-7B, utilizing strict RAG parameters to teach nutrition through gamification and storytelling.

**Benefits to client:**
NutriKid enables clinics to provide proactive, data-driven patient care. Clinics benefit from optimized appointment times, parents feel empowered and educated about dietary deficiencies, and children begin building healthy habits early in their lives.

*(Assigned to: Person 1)*

---

## 3. Introduction

### 3.1 Background
The rising concern over childhood obesity and, conversely, micronutrient malnutrition has underscored the need for accurate pediatric nutritional tracking. Traditionally, diet monitoring is a paper-based or disjointed process lacking real-time analytical capabilities and direct oversight from qualified medical professionals.

### 3.2 Problem Statement
Parents find it difficult to identify invisible nutritional gaps (like Iron or Calcium deficiencies) in their child's diet. Pediatricians do not have continuous visibility into a child’s health between visits and must rely on estimations. Furthermore, children see healthy eating as a chore because nutritional education is rarely engaging or age-appropriate.

### 3.3 Objectives
- Detail a secure, Role-Based Access Control (RBAC) platform for distinct user types (Parent, Doctor, Kid).
- Automate the discovery of nutritional gaps using AI Retrieval-Augmented Generation (RAG) based on ICMR and NIN guidelines.
- Facilitate direct, secure data-sharing and communication between parents and verified pediatricians.
- Gamify nutrition education to build better habits via an XP/Leveling engine and interactive AI chat.

### 3.4 Scope
This specification covers the functionality of the integrated NutriKid web application, including the Node.js/Express backend for core services and the Python/FastAPI architecture powering the AI inference and embeddings generation. It does not include native mobile applications (iOS/Android) but covers responsive web design across devices.

*(Assigned to: Person 2)*

---

## 4. System Overview

**System Architecture Overview:**
The system operates on a hybrid architecture. The client-side is a React frontend built with Vite and styled with Tailwind CSS. The primary backend handles business logic, security, and database (MongoDB) interactions using Node.js/Express. For heavy cognitive and data retrieval tasks, requests are routed to a distinct Python-based AI Engine leveraging FastAPI, Hugging Face models, and FAISS vector databases.

**Users of the system:**
- **Parents:** Manage child profiles, track growth, log meals, and manage doctor access.
- **Doctors:** Access patient records, view analytical charts, issue prescriptions, and handle requests.
- **Kids:** Interact with gamified UI, earn badges, and chat with the AI Food Buddy.

**Major Modules:**
- Authentication & Security Suite
- Parent Dashboard (Growth Tracking, Meal Logging)
- Doctor Dashboard (Patient Management, Medical Risk Alerts)
- Kids Mode (Gamification Engine, ChatLog)
- NutriKid AI Engine (RAG Pipeline, Triage System)

**General Workflow:**
Parent registers -> Creates Child Profile -> Parent logs daily meals/growth -> AI Engine analyzes gap and updates metrics -> Parent searches and connects with a Doctor -> Doctor views data and creates a prescription -> Child enters Kids Mode -> Child earns XP from parent's meal logs and chats with Food Buddy.

*(Assigned to: Person 2)*

---

## 5. Functional Requirements

**FR1: User Authentication and Management**
- **Description:** Secure login system supporting JWT tokens and Role-Based Access Control (RBAC). 
- **Inputs:** Username/Email, Password, Role type.
- **Outputs:** Access Token, Refresh Token, Dashboard redirection based on role.

**FR2: Parent Dashboard & Growth Tracking**
- **Description:** Ability for parents to add child profiles, track height/weight, calculate BMI, and log meals (Breakfast, Lunch, Dinner, Snacks).
- **Inputs:** Child demographics, meal details, weight (kg), height (cm).
- **Outputs:** Plotted timeline graphs, BMI status, JSON-based gap analysis of missing micronutrients.

**FR3: Doctor Access & Patient Triage**
- **Description:** A handshake protocol enabling doctors to request or be granted access to a child's medical and meal logs. Includes risk evaluation scoring.
- **Inputs:** Approval/Denial triggers, search criteria for hospital/doctor directory.
- **Outputs:** Connected patient lists, high/low risk alerts on the doctor’s dashboard, digital prescription generation.

**FR4: Gamified Kids Mode**
- **Description:** A dedicated dashboard for kids featuring an XP/leveling system and AI conversational partner. The AI must safely refuse medical queries.
- **Inputs:** Text queries from children, meal adherence data from parents.
- **Outputs:** Nutritional stories, badge unlocks, XP progress bar updates.

**FR5: AI Dietary Analysis & Escalation**
- **Description:** Utilizes LLM inferencing with ICMR textbooks via RAG to analyze meal logs and trigger medical escalation for rapid weight loss or severe deficiencies.
- **Inputs:** Array of recent meal logs, current growth metrics.
- **Outputs:** Markdown-formatted nutritional advice for parents, structured DB alerts for doctors.

*(Assigned to: Person 3)*

---

## 6. Non-Functional Requirements

| Requirement | Description |
| :--- | :--- |
| **Performance** | API responses (excluding AI text generation) must resolve under 200ms. AI generated context should resolve within 2-3 seconds using lightweight embedders. |
| **Security** | Passwords must be hashed using bcrypt. Sensitive health endpoints must be protected by strict RBAC middleware. Inputs must be validated using Zod. |
| **Reliability** | The platform should ensure 99.9% uptime. Meal events and database states must be fully transactional to avoid data corruption. |
| **Scalability** | Microservice-like separation of the NodeJS and Python backends allows independent scaling of AI inferencing nodes from standard HTTP traffic. |
| **Usability** | The Kid's Dashboard must feature large typography, high-contrast imagery, and intuitive navigation suitable for young children. |

*(Assigned to: Person 3)*

---

## 7. System Workflow / Process Flow

**Primary Application Workflow:**

1. **User Authentication Flow:**
   User visits app → Selects Role (Parent/Doctor) → Registers/Logs in → Receives JWT → Redirects to Role Dashboard.

2. **Meal Logging & Doctor Sync Flow:**
   Parent logs meals in Journal
   ↓
   Node.js saves `MealLog` to MongoDB
   ↓
   Node.js triggers Python AI Engine via internal API
   ↓
   FastAPI loads FAISS vector DB and Mistral-7B
   ↓
   AI detects Vitamin deficiency and flags as "Moderate Risk"
   ↓
   System notifies connected Doctor
   ↓
   Doctor reviews patient details and issues Prescription

3. **Gamification Flow:**
   Parent logs a healthy meal successfully 
   ↓
   System grants XP to Child's `Profile` 
   ↓
   Child logs into Kids Mode 
   ↓
   System triggers "Level Up" and displays Badge 
   ↓
   Child asks Food Buddy "Why are carrots good?" 
   ↓
   System uses RAG to fetch fun story and displays output.

*(Assigned to: Person 4)*

---

## 8. System Architecture / Design

The project is structured into three primary architectural components that communicate over standard RESTful APIs:

- **Frontend (Client Tier):** React.js utilizing Vite for lightning-fast HMR. State is managed locally, with charts rendered via Recharts, and animations mapped via Framer Motion. 
- **Backend (API Tier):** Node.js running Express.js handles CRUD operations, authentication, doctor-parent access handshakes, and interfaces directly with MongoDB via Mongoose ORM models (`User`, `Profile`, `MealLog`, `DoctorAccess`, `Prescription`).
- **AI Service (Compute Tier):** A Python FastAPI server. It contains the HuggingFace Inference API (`mistralai/Mistral-7B-Instruct-v0.2`), SentenceTransformers for embeddings, and FAISS for the vector database. It hosts stateless endpoints (`/chat`, `/analyze`) strictly dedicated to processing RAG queries.

**Module Breakdown:**
- **Auth Module:** JWT validation, Session configuration.
- **Profiles Module:** Parent/Child relationship mapping.
- **Analytics Module:** Chart generation, gap analysis translation.
- **AI Module:** RAG pipeline, Triage classifier, prompt formatting.

*(Assigned to: Person 4)*

---

## 9. Technologies Used

| Technology | Purpose |
| :--- | :--- |
| **React / Vite** | Web Frontend structure, UI rendering, fast bundling. |
| **Tailwind CSS & Framer Motion** | Responsive styling, component gamification, and UI animations. |
| **Node.js & Express.js** | Primary backend runtime and RESTful API framework. |
| **MongoDB & Mongoose** | NoSQL Database for flexible persistence of health, users, and logs. |
| **Python & FastAPI** | Microservice handling AI model inferences and heavy calculations. |
| **Mistral-7B & HuggingFace** | Core Large Language Model for chat and analysis. |
| **FAISS & SentenceTransformers** | Vector DB for RAG knowledge base (NIN & ICMR Textbooks). |
| **Zod** | Schema declaration and input validation. |

*(Assigned to: Person 5)*

---

## 10. Client Feedback and Requested Changes

During the stakeholder/client presentation, the following feedback was noted and applied to the current iteration:

| Feedback | Action Taken / Requested Change |
| :--- | :--- |
| *Improve visual tracking for parents.* | Implemented interactive timeline graphs using Recharts for BMI and weight. |
| *Ensure AI safety in Kids Mode.* | Added hardcoded system prompts to refuse clinical questions from Kids, redirecting them to parents. |
| *Granular privacy for Doctor access.* | Created a two-tier handshake protocol: "Restricted View" vs. "Full Access". |
| *Make medical text easy for AI to read.* | Converted ICMR and NIN PDF guidelines into clean text chunks for optimal FAISS vector indexing. |

*(Assigned to: Person 5)*

---

## 11. Changes to be Implemented (Future Improvements)

To increase the scope and usability of NutriKid in future phases, the following features will be implemented next:

- **Mobile Application Development:** Translating the React web app into React Native for direct iOS/Android deployment.
- **Push Notification System:** Automating reminders for meal logging, doctor appointments, and medication intake.
- **Wearable Device Integration:** Connecting to pediatric fitness trackers for automated activity API syncing.
- **Multilingual Support:** Localizing the platform and AI model instructions for local Indian languages (Hindi, Tamil, etc.) to improve accessibility.
- **Advanced Predictive Health Warnings:** Upgrading the AI engine to predict longitudinal growth stunting using deep neural networks instead of solely relying on LLM sentiment.

*(Assigned to: Person 1)*

---

## 12. Testing Strategy

The overall testing strategy for NutriKid validates the integrity of medical data and the security of RBAC pathways.

| Test Phase | Approach | Example Test Case | Expected Output |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | Validate individual functions (Zod schemas, BMI calculation). | Input: Height 100cm, Weight 15kg. | BMI calculates exactly to `15.0`. |
| **Integration Testing** | Test API data flow between Node.js and the Python FastAPI engine. | Input: Array of meal logs sent to `/api/analyze`. | Backend receives JSON with identified Iron gap. |
| **Security Testing** | Test Authorization barriers between roles. | Input: Parent attempts to access `/api/doctor/patients`. | System returns HTTP `403 Forbidden`. |
| **User Flow Testing** | End-to-end verification of expected user behaviors. | Input: Child interacts with Food Buddy asking for pills. | AI refuses question and drops conversational state. |

*(Assigned to: Person 3)*

---

## 13. Conclusion

**Achievements:**
NutriKid successfully demonstrates how modern web architectures and AI models can be harmoniously integrated to tackle real-world healthcare disparities. We built a robust, secure, and fully functional MERN + Python system capable of securely housing sensitive medical data while providing instant AI analytics.

**Benefits to Client:**
This project enables pediatric clinics to extend their care far beyond the 15-minute consultation window. By empowering parents with tools that detect nutritional gaps early and encouraging children via interactive gamification, NutriKid sets the foundation for lifelong holistic health. The architecture is modular and perfectly positioned for future scaling.

*(Assigned to: Person 2)*

---

## 14. References

1. **ICMR (Indian Council of Medical Research)** - Nutritional Guidelines for Indians.
2. **NIN (National Institute of Nutrition)** - Dietary requirements and caloric intake charts.
3. React documentation: [https://react.dev/](https://react.dev/)
4. FastAPI framework documentation: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
5. Meta FAISS (Facebook AI Similarity Search) repository.
6. Mistral AI documentation and Hugging Face model cards (`mistralai/Mistral-7B-Instruct-v0.2`).

*(Assigned to: Person 4)*
