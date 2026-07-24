# 🥦 NutriKids: Full Technical Documentation & Architecture Specification
This document serves as the complete technical blueprint and developer onboarding guide for **NutriKids** — an AI-powered pediatric nutrition intelligence and clinical-guided care platform.

---

## 1. High-Level Project Overview
NutriKids is a clinical-grade web platform designed to bridge the structural feedback and communication gaps between parents, children, pediatricians, and dietitians. Rather than relying on static documents, standard calorie diaries, or ungrounded conversational chatbots (which suffer from hallucinations and math inaccuracies), NutriKids implements a **deterministic hybrid planner engine** coupled with a **Hybrid Retrieval-Augmented Generation (RAG) pipeline**.

### Core Architecture Goals:
*   **Role-Based Access Control (RBAC)**: Secure workspaces for Parents, Doctors, Dietitians, and a restricted gamified Kids Mode.
*   **Mathematical & Clinical Safety**: Pre-prompt deterministic execution layers. Nutritional target mathematics and allergen exclusion filters are calculated purely in static Python code, ensuring the LLM cannot hallucinate unsafe dietary instructions.
*   **Hybrid RAG Retrieval**: Resolves dense vector search blindness of Indian local dietary keywords (like *ragi*, *khichdi*, *curd*) by merging dense FAISS semantic results with BM25 lexical keyword search.
*   **Uptime & Offline Resilience**: A centralized Model Router that handles cloud-based Google Gemini requests with automatic fallback to local Ollama (Mistral/Llama3) or static rule-based specialist modules.

---

## 2. Folder Structure
The workspace is split into three main modules: a Next.js frontend, an Express Node.js API backend, and a FastAPI Python AI compute service.

```bash
NutriBite-main/
├── frontend/                     # Next.js 16.2.4 Web Client
│   ├── Dockerfile                # Production multi-stage build script
│   ├── next.config.mjs           # Next.js config routing setup
│   └── src/
│       ├── app/                  # Next.js App Router (layout structure)
│       │   ├── doctor/           # Doctor portal page templates
│       │   ├── dietitian/         # Dietitian dashboard pages
│       │   ├── kids/             # Gamified kids interface page
│       │   ├── parent/           # Parent logs, directory, and analytics pages
│       │   └── login/            # Auth pages
│       ├── react_pages/          # Reusable react screen components
│       ├── components/           # UI elements (common, resource layouts)
│       ├── context/              # Context Providers (Auth, Theme, Profile)
│       └── styles/               # CSS modules & styling configs
│
├── backend/                      # Node.js + Express.js API Gateway
│   ├── Dockerfile                # Node container configuration
│   ├── config/                   # MongoDB database connectivity
│   ├── controllers/              # MVC controllers (Auth, access checks, logs)
│   ├── middlewares/              # JWT parse, RBAC guards, ownership check
│   ├── models/                   # Mongoose collection schemas (21 collections)
│   └── routes/                   # Express entry routes
│
└── ai-service/                   # FastAPI Python AI Microservice (Port 8000)
    ├── Dockerfile                # Python environment container setup
    ├── requirements.txt          # Python dependency checklist
    ├── app/
    │   ├── api/                  # FastAPI router mounts
    │   ├── db/                   # JSON DB loaders & allergy checkers
    │   ├── guardrails/           # Injection shields & medical filters
    │   ├── models/               # ModelRouter and comparative benchmark
    │   ├── planner/              # Deterministic target calculators
    │   ├── prompts/              # Dynamic prompt builders
    │   └── rag/                  # Hybrid retriever (FAISS + BM25 + Cross-Encoder)
    ├── datasets/                 # Guideline datasets (foods, conditions, rag logs)
    └── vector_store/             # FAISS binary vector indexes
```

---

## 3. Complete Frontend Pages
The Next.js client renders dynamic pages with smooth GSAP and Framer Motion micro-animations:

### A. Auth & Marketing Screens:
1.  **Landing Page (`LandingPage.jsx`)**: Responsive presentation of product vision, features list, user reviews, and CTA buttons.
2.  **About Page (`AboutPage.jsx`)**: Documents mission statement, team members, and scientific guidelines references.
3.  **Features Page (`FeaturesPage.jsx`)**: Elaborates on RAG, gamified companion system, and clinician portals.
4.  **Register (`Register.jsx`) & Login (`Login.jsx`)**: Forms utilizing email verification, role selectors (Parent, Doctor, Dietitian), and 2FA input boxes.
5.  **Password Management (`ForgotPassword.jsx`, `ResetPassword.jsx`)**: Token-based password recovery.

### B. Parent Command Center:
6.  **Parent Dashboard (`ParentDashboard.jsx`)**: Displays linked child profiles list, shortcut toggles for Kids Mode, local alerts feed, and summary widgets.
7.  **My Children (`MyChildren.jsx` / `ChildDetails.jsx`)**: Interactive details showing active child profile statistics. Enables parents to log daily meals, track sleep duration, log sports activities, and see active prescriptions.
8.  **Doctor Access (`DoctorAccess.jsx`)**: Outbox/Inbox logs for pending doctor link invitations. Parents can configure permission tiers (Restricted vs. Full Access) or revoke connections.
9.  **Wellness Analysis (`WellnessAnalysis.jsx`)**: Renders Recharts-based timeline graphs plotting longitudinal heights, weights, BMIs, and calorie intake balances.
10. **Book Appointment (`BookAppointment.jsx` & `MyAppointments.jsx`)**: Appointment calendar widget letting parents book clinical slots with pediatricians.
11. **Directory (`Directory.jsx`)**: Spatial index search panel displaying nearby clinics and registered specialists based on geographical coordinates.
12. **Resources Library (`ResourcesLibrary.jsx`)**: Dynamic search layout populated with pediatric recipes and nutrition guidelines cards (`RecipeCard.jsx`).

### C. Clinician Workspaces:
13. **Doctor Dashboard (`DoctorDashboard.jsx`)**: Provider inbox tracking requested patients list and critical risk escalation cases.
14. **Patient Details (`PatientDetails.jsx`)**: Renders active logs (meals, growth, activities) of authorized child patients. Includes tools to write digital prescriptions and save clinical notes.
15. **Doctor Profile (`DoctorProfile.jsx`) / Dietitian Profile (`DietitianProfile.jsx`)**: Specialization parameters, hospital address, and availability selectors.
16. **Dietitian Dashboard (`DietitianDashboard.jsx`) & Case Detail (`DietitianCaseDetail.jsx`)**: Specialized cases tracking layout for managing pediatric diet plans and long-term habits trend reviews.

### D. Kids Companion View:
17. **Kids Dashboard (`KidsDashboard.jsx`)**: The gamified screen displaying equipped mascot avatars, levels, XP bars, and the Food Buddy RAG chatbot.

---

## 4. Backend Architecture
The backend is structured as a robust, decoupled Express application:

*   **API Gateway Router**: Mounted on `app.js`, handles rate-limiting, CORS origin validations, request logs, and OpenTelemetry instrumentation before delegating requests to routers.
*   **Controller Tier**: Controllers receive parsed request parameters, call database services, evaluate security bounds, and execute backend computations.
*   **Middleware Pipeline**:
    *   `auth.middleware.js`: Extracts and validates JWTs from HTTP-only cookies.
    *   `role.middleware.js`: Enforces RBAC checks (e.g. rejecting parent access on doctor routes).
    *   `ownership.middleware.js`: Ensures a parent can only retrieve details belonging to their own registered child profiles.
    *   `doctor.middleware.js`: Verifies active, parent-approved invitations before letting a clinician inspect child data.

---

## 5. Database Schema
MongoDB Atlas is used for persistence, with Mongoose schemas defining explicit data validation rules:

### 1. `User` Schema
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['parent', 'doctor', 'dietitian'], required: true },
  availabilityStatus: { type: String, enum: ['Available', 'Busy', 'Offline'], default: 'Offline' },
  is2FAEnabled: { type: Boolean, default: false },
  loginOTPHash: String,
  loginOTPExpiresAt: Date,
  parentProfile: { phoneNumber: String, city: String, relationToChild: String },
  doctorProfile: { specialization: String, hospitalName: String, experienceYears: Number, registrationId: String },
  dietitianProfile: { specialization: String, experienceYears: Number, registrationId: String }
}
```

### 2. `Profile` Schema (Child)
```javascript
{
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  sportsActivityLevel: { type: String, enum: ['Very Active', 'Active', 'Moderately Active', 'Low Activity', 'Sedentary'] },
  healthConditions: [String],
  goals: { primary: { type: String, required: true }, secondary: [String] },
  preferences: { favoriteFoods: String, dislikedFoods: String, waterIntake: Number, sleepDuration: Number },
  level: { type: Number, default: 1 },
  currentXP: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  equippedCompanion: { type: String, default: 'Captain Milk' }
}
```

### 3. `MealLog` Schema
```javascript
{
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true, index: true },
  breakfast: [foodItemSchema],
  morningSnack: [foodItemSchema],
  lunch: [foodItemSchema],
  afternoonSnack: [foodItemSchema],
  eveningSnack: [foodItemSchema],
  dinner: [foodItemSchema],
  completedMealsCount: { type: Number, default: 0 }
}
```
*Note: `foodItemSchema` includes `name`, `quantity`, `calories`, `protein`, `carbs`, `fats`, `fiber`, `water`.*

### 4. `DoctorAccess` Schema
```javascript
{
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  status: { type: String, enum: ['pending', 'restricted', 'active', 'rejected'], default: 'pending' },
  fullAccessRequested: { type: Boolean, default: false }
}
```

### 5. `GrowthRecord` Schema
```javascript
{
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  bmi: { type: Number, required: true },
  riskStatus: { type: String, enum: ['underweight', 'normal', 'overweight', 'obese'] },
  recordedByRole: { type: String, enum: ['parent', 'doctor'] }
}
```

### 6. `Escalation` Schema
```javascript
{
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  symptoms: [String],
  riskLevel: { type: String, enum: ['low', 'moderate', 'high'] },
  triageStatus: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

### 7. `Appointment` Schema
```javascript
{
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slotTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' }
}
```

---

## 6. ER Diagram Description
```
               +-------------------+
               |       USER        |
               +-------------------+
               | _id (PK)          | <---------------+
               | email (Unique)    |                 |
               | role (Enum)       |                 |
               +-------------------+                 |
                /                 \                  |
               /                   \                 |
       (1)    /                     \ (1)            |
             /                       \               |
            v                         v              |
   +-----------------+       +-------------------+   |
   |     PROFILE     |       |   DOCTOR ACCESS   |   |
   +-----------------+       +-------------------+   |
   | _id (PK)        | <---+ | _id (PK)          |   | (1) Parent / Doctor
   | parentId (FK)   |--+  | | parentId (FK)     |---+
   | name            |  |  | | doctorId (FK)     |---+
   +-----------------+  |  | | profileId (FK)    |
      |          |      |  | +-------------------+
      | (1)      | (1)  |  |
      v          v      |  +--------------------+
+---------+ +---------+ |                       |
| MEAL    | | GROWTH  | |                       |
| LOG     | | RECORD  | |                       |
+---------+ +---------+ |                       |
| _id(PK) | | _id(PK) | |                       |
| profile | | profile | |                       |
| Id(FK)  | | Id(FK)  | |                       |
+---------+ +---------+ |                       |
                        v                       v
               +-------------------+   +------------------+
               |    ESCALATION     |   |   APPOINTMENT    |
               +-------------------+   +------------------+
               | _id (PK)          |   | _id (PK)         |
               | profileId (FK)----+   | patientId (FK)---+
               | doctorId (FK)-----+   | providerId (FK)--+
               +-------------------+   +------------------+
```
*   **User to Profile**: One-to-Many. A parent User can register multiple child Profiles.
*   **Profile to MealLog / GrowthRecord**: One-to-Many. A child profile gathers multiple daily logs and historical weight records.
*   **User & Profile to DoctorAccess**: Many-to-Many mapping. Associates doctor, parent, and child in a handshake record.
*   **Profile & Doctor to Escalation**: Many-to-One. Triage logs assign risky children profiles to doctor users.
*   **Profile & Doctor to Appointment**: Many-to-Many. Maps specific scheduled dates.

---

## 7. API Catalog

### Auth API (`/api/auth`)
*   `POST /api/auth/register` (Public): Registers a User. Returns token.
*   `POST /api/auth/login` (Public): Validates password. Triggers 2FA logic if enabled. Returns JWT cookie.
*   `GET /api/auth/me` (Protected): Returns current logged in user details.
*   `POST /api/auth/verify-2fa` (Public): Submits 2FA codes.
*   `POST /api/auth/forgot-password` (Public): Triggers mail containing OTP codes.
*   `POST /api/auth/reset-password` (Public): Validates OTP and updates password.
*   `PATCH /api/auth/availability` (Protected): Updates doctor/dietitian status.

### Child Profiles API (`/api/profiles`)
*   `POST /api/profiles/` (Parent): Registers child demographics (avatar, age, height, weight).
*   `GET /api/profiles/` (Parent): Returns child logs belonging to current parent.
*   `GET /api/profiles/:id/diet-plan` (Protected): Serves planned diets.
*   `POST /api/profiles/:id/reanalyze` (Parent): Recalculates deficiencies and targets.

### Doctor Operations API (`/api/doctor`)
*   `GET /api/doctor/nearby` (Parent): Matches spatial indices to find closest pediatrician coordinates.
*   `GET /api/doctor/all` (Protected): Clinic directories search.
*   `GET /api/doctor/patients` (Doctor): Patients who approved access.
*   `GET /api/doctor/patients/:id` (Doctor): Detailed patient chart notes and logs.
*   `PATCH /api/doctor/patients/:id/notes` (Doctor): Updates diagnostics notes.
*   `GET /api/doctor/patients/:id/growth-velocity` (Doctor): Retrieves velocity indices.

### Meal Logs API (`/api/meals`)
*   `POST /api/meals/` (Parent): Stages food arrays for daily slot index.
*   `GET /api/meals/history/:id` (Protected): Child food diaries logs timeline.
*   `POST /api/meals/analyze-image` (Parent): Submits image logs to vision model analysis.

### Doctor Access Invites (`/api/parent/access`)
*   `POST /api/parent/access/invite` (Parent): Dispatches access invitation to a doctor.
*   `GET /api/parent/access/list` (Parent): Returns pending/active links.
*   `PUT /api/parent/access/revoke/:requestId` (Parent): Instantly breaks access link.

### Appointments API (`/api/appointments`)
*   `POST /api/appointments/book` (Parent): Schedules slots.
*   `GET /api/appointments/` (Parent): Active schedule lists.
*   `PATCH /api/appointments/:id/cancel` (Parent): Marks appointment status as cancelled.

---

## 8. AI Architecture
The FastAPI Python microservice uses a multi-layered hybrid design:

```
[User Query] -> [Security Shield: Injection Scan] -> [Emergency Filter: Symptom Audit]
     |
     v
[Hybrid Retriever] (RRF Rank Merger) <--- (FAISS Dense Vector + BM25 Lexical)
     |
     v
[Cross-Encoder Reranker] (cross-encoder/ms-marco-MiniLM-L-6-v2)
     |
     v
[Deterministic Planner Engine] (Target Calorie Calculations & Allergy Exclusion Filters)
     |
     v
[Dynamic Prompt Assembler] (Packs Profile, Context, numerical truth, and persona rules)
     |
     v
[Model Router] (Ollama Local Inference <--> Google Gemini Cloud API)
```

*   **LLM Model Routing**: Central router utilizing Google Gemini 1.5 Flash (standard mode) or Local Ollama Llama3/Mistral (Privacy Mode Toggle).
*   **Embeddings Model**: `intfloat/e5-small-v2` (384 dimensions, requires `passage:` and `query:` prefixes).
*   **Vector Database**: Facebook AI Similarity Search (FAISS) `IndexFlatIP` CPU container.
*   **RAG Architecture**: BM25 lexical retriever combined with FAISS dense vector similarity, fused using Reciprocal Rank Fusion (RRF), and ranked via `cross-encoder/ms-marco-MiniLM-L-6-v2` reranker.
*   **Knowledge Sources**: Structured textual datasets parsed from official ICMR Pediatric Nutrition Guidelines, WHO Growth Standards, and NIN India recommendations.

---

## 9. Authentication System
The platform implements state-of-the-art token security:
*   **JWT session cookies**: Issued at login with HTTP-only, secure flag configurations, shielding tokens from XSS hijacking.
*   **Two-Factor Authentication (2FA)**: Generates high-entropy OTP codes sent via console/email.
*   **Login Lockouts**: Tracks failed attempts per account. Enforces a 15-minute lockout if attempts exceed 5 failures.
*   **Password Hashing**: Bcrypt hashes with 10 salt rounds before database persistence.

---

## 10. User Roles
*   **Parent**: Can manage child profiles, log daily meals/symptoms, invite/revoke doctor access, schedule appointments, and toggle Privacy Mode.
*   **Doctor**: Can request patient access, review meal logs/growth charts, configure clinical notes, analyze growth velocity curves, and write prescriptions.
*   **Dietitian**: Can review patient health files, compile customized meal plans, and track long-term nutrition metrics.
*   **Child (Kids Mode)**: Restricted gamified workspace. Can interact with equipped mascot companion avatars, complete daily curiosity quests, and earn XP. Has absolutely zero edit access to medical or profile logs.

---

## 11. Current Implemented Features
*   **Role-Based Dashboards**: Independent views for parents, doctors, and kids.
*   **Diet Journal & Indian Food Database**: Logging engine populated with 115+ local items mapping exact portion weights.
*   **Deterministic Python Planner**: Algorithmic calculator that computes precise nutritional targets and filters out ill-suited/allergenic foods before prompts reach the LLM.
*   **Growth Velocity Monitor**: Computes percentile drifts, stability indices, and risk weights using WHO reference charts.
*   **Geospatial Clinics Search**: MongoDB spatial indexing queries mapping closest pediatric clinics.
*   **Kids Gamified Mascot Engine**: Awards XP multipliers for logging consecutive healthy meals. Implements a rate limiter to block XP farming exploits.
*   **Real-time AI Chat**: Streams RAG recommendations to parents with a `|||DETAILED|||` toggle to toggle basic vs clinical details.

---

## 12. Missing Features (Staged Roadmap)
*   **Vision-Based Meal Logging**: Letting parents photograph child meal plates and using Gemini Vision API to instantly classify ingredients and log portions.
*   **WHO Z-Score Percentile Charts**: Plotting weight-for-age and height-for-age standard Z-scores directly on Recharts timeline lines.
*   **Vernacular Language Support**: Translating prompt builders to enable Telugu, Hindi, and Tamil conversational capabilities.
*   **Wearable APIs Sync**: Direct integration with Fitbit or Apple Health to modify calorie targets based on physical trackers data.

---

## 13. Libraries Used

### Backend Dependencies:
*   `express` (Web framework)
*   `mongoose` (MongoDB object modeling)
*   `jsonwebtoken` (HMAC signing)
*   `bcrypt` (Hashing algorithms)
*   `zod` (Input type-safeties validation)
*   `socket.io` (Real-time socket loops)
*   `rbush` (2D spatial indexing trees)
*   `helmet` (HTTP header security shields)

### Frontend Dependencies:
*   `next` (Framework)
*   `react` (UI state engine)
*   `recharts` (Growth velocity charts)
*   `framer-motion` & `gsap` (Dynamic rendering and animations)
*   `socket.io-client` (Websockets)

### AI Service Dependencies:
*   `fastapi` & `uvicorn` (Python API runtime)
*   `sentence-transformers` & `transformers` (Dense vector models)
*   `faiss-cpu` (Vector store)
*   `pymongo` (Database operations)

---

## 14. Deployment
The platform orchestrates its production container suite using standard Docker Compose configurations:

*   **NutriKids-db**: Custom MongoDB container holding collections.
*   **NutriKids-ollama**: Local llama3/mistral daemon for Privacy Mode execution.
*   **NutriKids-ai-service**: FastAPI image exposing port 8000.
*   **NutriKids-api-backend**: Node server exposing port 5000.
*   **NutriKids-frontend**: Next.js client mapping port 3000.
*   **NutriKids-prometheus & NutriKids-grafana**: Scrapes telemetry logs and displays latency charts.

---

## 15. Environment Variables

### Express Backend:
```bash
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nutrikid
JWT_SECRET=super_secure_random_key_64_characters
AI_SERVICE_URL=http://localhost:8000
PARENT_2FA_MANDATORY=false
SMS_PROVIDER=console
```

### FastAPI Python AI Service:
```bash
GEMINI_API_KEY=your_google_gemini_key_here
OLLAMA_HOST=http://localhost:11434
RATE_LIMIT_PER_MINUTE=60
```

---

## 16. Current Project Flow
1.  **User Authentication**: User registers, selects `parent`, and logs in. JWT cookie is set.
2.  **Child Profile Creation**: Parent registers child profile (e.g. 5yo, egg-allergy).
3.  **Meal Logging**: Parent logs "boiled egg" in breakfast journal.
4.  **Security/Planner Pre-processing**:
    *   Express routes request to FastAPI `/ask`.
    *   FastAPI active shield gate processes query.
    *   FastAPI Planner compares ingredients list with child profile allergies list.
    *   Planner identifies egg-protein conflict, flags it, and excludes it from recommendation parameters.
5.  **Prompt Building & LLM Routing**:
    *   FastAPI retriever pulls ICMR guidelines chunks regarding allergy safety.
    *   Prompt builder constructs the master context.
    *   Model Router dispatches prompt to Gemini.
    *   Gemini returns a formatted response explaining safety exclusions.
6.  **Response Delivery**: Express returns payload to Next.js client to update UI.

---

## 17. Architecture Diagram Explanation
```
                        [Next.js Client]
                         |          ^
             (1) REST API|          | (6) JSON Payload
                         v          |
               [Express Gateway]    |
               [RBAC / JWT Check]   |
                         |          |
         (2) internal ask|          | (5) Final Structured Answer
                         v          |
    +───────────────────[FastAPI AI Service]────────────────────+
    |                                                           |
    |  [Active Shield Gate] --> [Safety & Lockout Check]        |
    |                                    |                      |
    |                                    v                      |
    |    [Cross-Encoder] <------- [RRF Fusion]                  |
    |           |               (BM25 + FAISS)                  |
    |           v                                               |
    |  [Deterministic Planner] (Calculates Calories/Allergies)  |
    |           |                                               |
    |           v                                               |
    |  [Prompt Builder] (Constructs system rules prompt)         |
    |           |                                               |
    |           v                                               |
    |  [Model Router] =======> [Gemini API / Local Ollama]      |
    +───────────────────────────────────────────────────────────+
```
Every incoming request starts at the client, passes through JWT/RBAC middleware blocks on Express, and forwards query details to FastAPI.
FastAPI executes sequential security filtering, extracts relevant guideline context via BM25/FAISS, computes nutritional math deterministically in python, dynamically builds prompt rules, routes context to the appropriate LLM, and formats the response for Next.js rendering.

---

## 18. Components that can be Reused for Agentic AI
1.  **Deterministic Planner Engine (`app/planner/engine.py`)**: Can serve as a Python tool/function execution agent tool (e.g. `calculate_child_nutrition_goals_tool` or `filter_allergens_tool`) that agents can execute using structured schemas.
2.  **Hybrid RAG Retriever (`app/rag/hybrid_retriever.py`)**: Can serve as a semantic search tool for search agents.
3.  **Active Shield Injection Gate (`app/guardrails/security_guardrails.py`)**: Safeguards multi-agent inputs from prompt injections.
4.  **Model Router (`app/models/model_router.py`)**: Orchestrates cost-effective model fallback tasks.

---

## 19. Components that Should Not Be Modified
1.  **JWT and Authentication Handshake Middlewares**: These verify user roles and are critical for protecting HIPAA-sensitive pediatric data.
2.  **Calorie Targets and Growth Velocity Math Modules**: Relying on LLMs for growth calculations is clinical risk; this logic must remain deterministic.
3.  **Core Mongoose Models**: The fields in `User`, `Profile`, and `MealLog` schemas are tightly coupled to Express handlers and Next.js frontend pages.

---

## 20. Suggestions for Converting this into a Multi-Agent AI Platform
To transition NutriKids from a single-agent chat engine to an advanced Multi-Agent AI platform, we suggest:

```
                  +-----------------------------------+
                  |         Orchestrator Agent        |
                  |     (LangGraph / CrewAI Supervisor)  |
                  +-----------------------------------+
                     /         |             |       \
                    /          |             |        \
                   v           v             v         v
             +----------+ +----------+ +----------+ +----------+
             |  Parent  | |   Kid    | | Clinical | | Dietitian|
             | Advisor  | | Companion| |  Triage  | | Planner  |
             |  Agent   | |  Agent   | |  Agent   | |  Agent   |
             +----------+ +----------+ +----------+ +----------+
                   \           |             |         /
                    \          |             |        /
                     v         v             v       v
                  +-----------------------------------+
                  |        Central Event Broker       |
                  |        (Redis PubSub Channel)     |
                  +-----------------------------------+
                                   |
                                   v
                         [Shared Mongo State]
```

1.  **Deploy Specialized Micro-Agents**:
    *   **Parent Advisor Agent**: Focuses on explaining deficiencies and addressing parent concerns.
    *   **Kid Companion Agent**: Assumes companion personalities (e.g. Captain Milk) to guide children in Kids Mode.
    *   **Clinical Triage Agent**: Audits logged symptoms (like fever or vomiting) and manages automatic escalation alerts for pediatricians.
    *   **Dietitian Planner Agent**: Automates meal suggestions and coordinates grocery lists based on budget or availability restrictions.
2.  **Stateful Multi-Agent Orchestrator**: Implement **LangGraph** or **CrewAI** to manage execution flows, letting the Orchestrator route queries dynamically between agents based on intent.
3.  **Shared Memory Scratchpad Database**: Store transient agent execution logs in a MongoDB scratchpad collection so agents can reference historical interactions of other agents.
4.  **Asynchronous Communication (Redis Pub/Sub)**: Replace standard HTTP REST connections with a Redis-backed message broker. Tapping a button fires events that agents can read and process in the background.
