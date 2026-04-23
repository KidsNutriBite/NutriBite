# NutriKid – Doctor-Guided Pediatric Nutrition Platform 🦁🥦

## Mission
Build a production-quality, full-stack MERN application for pediatric nutrition tracking with doctor oversight, parent controls, and a gamified Kids Mode.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js, Express.js, MongoDB
- **AI Engine**: Python, FastAPI, FAISS (Vector DB), SentenceTransformers, HuggingFace Inference Client
- **Auth**: JWT, bcrypt, RBAC
- **Validation**: Zod
- **Gamification**: Custom XP/Leveling Engine

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ../nutrikid-backend && pip install -r requirements.txt
   ```

2. **Environment Variables**
   Create `.env` in `backend/`, `frontend/`, and `nutrikid-backend/` (see `.env.example`).

3. **Run Application**
   ```bash
   # Root directory - Runs Frontend, Backend, and AI Service concurrently
   npm run dev
   ```

## 🏗️ Comprehensive Architecture: Module Mapping, API & DB Schema

| Module Name | Key Features | Main Endpoints (Base Paths) | Associated DB Schemas |
| :--- | :--- | :--- | :--- |
| **Authentication & Security** | JWT Auth, Role-Based Access (RBAC), Session Mgmt | `/api/auth/register`, `/api/auth/login`, `/api/auth/me` | `User`, `AuditLog` |
| **Parent Dashboard** | Child Management, Growth Tracking, Nutrition Log | `/api/parent/*`, `/api/profiles/*`, `/api/growth/*`, `/api/meals/*` | `Profile`, `GrowthRecord`, `MealLog`, `MissedMealEvent` |
| **Doctor Dashboard** | Patient List, Notes, Prescriptions, Access Approvals | `/api/doctor/*`, `/api/access/*`, `/api/analytics/*` | `DoctorAccess`, `Prescription` |
| **Kids Mode (Gamified)** | XP/Level Engine, Badges, Food Buddy AI Chat | `/api/game/*`, `[FastAPI Backend: /ask]` | `ChatLog`, `Profile (XP fields)` |
| **NutriKid AI Engine** | RAG Context Search, Medical Risk Escalation | `[FastAPI Backend: /chat]`, `[FastAPI Backend: /analyze]` | *None (Stateless / Logs in MongoDB)* |
| **Core Services** | Hospital Locator, Appointments, Notifications | `/api/hospitals/*`, `/api/appointments/*`, `/api/notifications/*` | `Appointment`, `Notification` |

### 1. 🔐 Authentication & Security Suite
- **JWT Authentication**: Secure stateless authentication with Access and Refresh tokens.
- **RBAC (Role-Based Access Control)**: Distinct flows for **Parents**, **Doctors**, and **Kids**.
- **Secure Registration**: Zod-validated sign-up forms with error handling.
- **Session Management**: Automatic token rotation and logout handling.

### 2. 🧑‍🧑‍🧒 Parent Dashboard (Command Center)
- **Child Management**:
  - Add multiple child profiles with avatars (Lion, Bear, Rabbit, etc.).
  - Edit medical details (Age, Weight, Gender, Known Conditions).
- **Growth Tracking**:
  - **Log Growth**: Record Height and Weight entries.
  - **Visual Timeline**: Interactive charts visualizing growth trends over time.
  - **BMI Calculator**: Auto-calculation of Body Mass Index.
  - **Record Management**: Delete incorrect or duplicate entries.
- **Nutrition Journal**:
  - **Meal Logging**: Log Breakfast, Lunch, Dinner, and Snacks.
  - **History**: View past meal logs by date.
  - **Gap Analysis**: AI-driven breakdown of micronutrient deficiencies (Iron, Calcium, etc.).
- **Doctor Handshake Protocol**:
  - **Search Directory**: Find pediatricians by location or name.
  - **Access Control**: Approve/Deny doctor connection requests.
  - **Granular Permissions**: Grant "Restricted View" (Basic Info) or "Full Access" (Detailed Logs).

### 3. 👨‍⚕️ Doctor Dashboard (Specialist View)
- **Patient Management**:
  - **My Patients**: List of all connected families.
  - **Access Requests**: Request access to new patients via email secure link.
  - **Status Indicators**: Visual cues for "Active", "Pending", or "Restricted" access.
- **Clinical Tools**:
  - **Patient Details**: Deep-dive into a child's nutrition and growth history.
  - **Prescription System**: Create and manage digital prescriptions with instructions.
  - **Clinical Notes**: Private notes for medical observations.
- **Analytics & Risk**:
  - **Meal Frequency Charts**: Visualize eating patterns.
  - **Medical Risk Alerts**: Automatic flags for high-risk health data (e.g., rapid weight loss).

### 4. 🦁 Kids Mode (Gamified Experience)
- **Interactive Dashboard**:
  - Simplified, colorful interface designed for children.
  - **Food Buddy AI**: A friendly, superhero-themed chat companion.
    - **Safe AI**: Refuses medical queries, encourages asking parents.
    - **Storytelling**: Explains food benefits using fun stories (e.g., "Carrots give you super sight!").
- **Gamification Engine**:
  - **XP & Leveling**: Earn XP for logging healthy meals.
  - **Badges**: Unlock achievements (e.g., "Green Giant", "Hydration Hero").
  - **Visual Progress**: Progress bars and animated celebrations.

### 5. 🧠 NutriKid AI Engine (Python/FastAPI)
- **Base LLM & Inferencing**:
  - **Base Model**: `mistralai/Mistral-7B-Instruct-v0.2` (Accessed via Hugging Face Inference API).
  - **Prompting Strategy**: Zero-shot, highly structured context-aware prompting. 
  - **Fine-tuning**: *No direct model weights fine-tuning is performed.* The system relies strictly on **RAG (Retrieval-Augmented Generation)** to inject medical context into the base Instruct model, ensuring answers remain locked to medically verified data rather than relying on the LLM's internal knowledge.
- **RAG Pipeline (Retrieval-Augmented Generation)**:
  - **Embedder Model**: `sentence-transformers/all-MiniLM-L6-v2` is used for high-speed, lightweight vectorization (384 dimensions). It supports switching to `BAAI/bge-large-en-v1.5` (1024 dimensions) for heavy lifting.
  - **Vector Database**: FAISS (Facebook AI Similarity Search) is used to index and retrieve document chunks optimally.
  - **Knowledge Base (Textbooks used for RAG)**: Encoded directly from official **ICMR (Indian Council of Medical Research)** and **NIN (National Institute of Nutrition)** dietary guidelines and pediatric nutrition textbooks. The data is pre-embedded into `faiss_textbooks.index`.
- **Smart Capabilities & Features**:
  - **NutriGuide Assistant**: For Parents – provides detailed, medically-referenced advice with Markdown formatting.
  - **Food Buddy AI**: For Kids – a fun, superhero-themed persona that refuses medical queries and focuses on storytelling.
  - **Dietary Analysis**: Analyzes meal logs to detect specific vitamin/mineral gaps and suggests food corrections using structured JSON output.
- **Medical Escalation Engine**:
  - **Hybrid Risk Detection**: Combines keyword scanning with LLM sentiment analysis.
  - **Triage System**: Classifies inputs as **Low**, **Moderate**, or **High** risk.
  - **Doctor Loop**: Automatically escalates High-risk events to the assigned pediatrician's dashboard.

### 6. 🏥 Core Services
- **Appointments**: Integrated booking system for consultations.
- **Hospital Directory**: Location-based search for nearby clinics.
- **Resource Library**: Curated, searchable library of pediatric health articles.

## Development Status: ✅ COMPLETE

All planned phases have been verified and deployed locally.

### ✅ Phase 1: Foundation
- Monorepo setup, Auth System, Database Schema.

### ✅ Phase 2: Parent Features
- Dashboard, Meal Logging, Growth Tracking, Child Profile.

### ✅ Phase 3: Doctor & Clinical
- Doctor Dashboard, Handshake Protocol, Prescription Management.

### ✅ Phase 4: Analytics Setup
- Charts, Graphs, and Data Visualizations.

### ✅ Phase 5: Kids & AI
- Gamification, Food Buddy, RAG Engine, Risk Escalation.

## Documentation
See `docs/` folder for Architecture, API Contracts, and Roles.
Refer to `master_verification_guide.md` for full end-to-end testing steps.
