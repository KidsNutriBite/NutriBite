# Phase 12: Dynamic NER UI Audit Report

## 1. Existing Frontend Architecture
- **Framework:** Next.js (App Router setup with `app` and `react_pages` directories).
- **Layouts:** Uses nested layouts. `AdminLayout.jsx` wraps the admin portal providing a side navigation bar and top header.
- **Routing:** Handled via Next.js `app` directory (e.g., `app/admin/layout.js`, `app/admin/dashboard/page.js` mapping to `react_pages/admin/AdminDashboard.jsx`).
- **State Management:** React hooks (`useState`, `useEffect`) and Context API (`AuthContext`, `ThemeContext`).

## 2. Existing Design System/Colors
- **Styling:** Tailwind CSS with a consistent color palette utilizing specific names (e.g., `primary`, `slate`, `emerald`, `rose`, `amber`, `blue`, `purple`).
- **Typography:** Uses `Plus_Jakarta_Sans` via Next.js Google Fonts optimization.
- **Theme:** Supports dark/light mode toggling via `ThemeContext`.
- **UI Elements:** Heavy use of rounded corners (`rounded-xl`, `rounded-2xl`), subtle borders (`border-slate-200/80`), shadow (`shadow-sm`, `shadow-md`), and Material Symbols Outlined for icons. Background gradients and glassmorphism (backdrop blur) effects are also present.

## 3. Existing Reusable Components
- **Layout Components:** `AdminLayout` wrapper.
- **Feedback:** `react-hot-toast` for notifications.
- **Icons:** Material Symbols (`<span className="material-symbols-outlined">...</span>`).
- **Buttons/Badges:** Styled directly with Tailwind classes (e.g., `bg-primary text-white`, status badges using `emerald-50 text-emerald-700`).

## 4. Existing Routes
- **Admin:** `/admin/dashboard`, `/admin/users`, `/admin/parents`, `/admin/doctors`, `/admin/activity`, `/admin/security`.
- **Other Roles:** `/doctor`, `/dietitian`, `/parent`, `/guest`, `/kids`.

## 5. Existing Dynamic NER APIs
- **Base URL:** Fast API backend (`ai-service-v2` at port 8000).
- **Dynamic Entities (`/entities`):**
  - `POST /entities`: Propose entity.
  - `GET /entities`: List entities.
  - `POST /entities/seed-defaults`: Seed default phase 1 entities.
  - `POST /entities/discover`: Trigger candidate discovery.
  - `GET /entities/{id}`: Get entity details.
  - `PUT /entities/{id}`: Update entity.
  - `PATCH /entities/{id}/lifecycle`: Transition lifecycle status.
  - `DELETE /entities/{id}`: Delete entity.
- **Candidate Review (`/candidates`):**
  - `GET /candidates/review-summary`: Summary statistics.
  - `GET /candidates/analytics/group-review`: Group deduplication analytics.
  - `GET /candidates/analytics/effort-metrics`: Annotation effort metrics.
  - `GET /candidates/analytics/embedding-thresholds`: Embedding thresholds evaluation.
  - `GET /candidates`: List candidates.
  - `GET /candidates/{id}`: Get candidate.
  - `PATCH /candidates/{id}/review`: Submit human review decision.
- **RAG & Chat (`/chat`, `/ask`, `/debug/retrieve`):**
  - Available for live NER demo and Entity-Aware RAG demo.

## 6. Missing APIs/features required by the UI
- **Live NER Evaluation Dashboard APIs:** The `ai-service-v2` seems to lack a specific evaluation trigger/stats endpoint (`/entities/evaluate` or similar) returning Micro Precision, Recall, and F1 explicitly for the newly adapted model, though we have candidate effort/embedding metrics. There isn't an explicit endpoint to *start adaptation* (`[Start Adaptation]`) returning a training status like "Preparing Dataset, Training, Evaluating, Completed".
- **Live NER Demo API:** While `chat.py` exists, an explicit pure NER extraction endpoint (e.g., `POST /ner/extract`) to highlight entities in custom text might be missing in `router.py`.

## 7. Any backend changes required before UI implementation
Before building the full UI, we must implement in `ai-service-v2`:
1. **Model Adaptation API (`/api/v1/adaptation.py`):** An endpoint to trigger training/adaptation (`POST /adaptation/train`) and fetch status (`GET /adaptation/status`) returning evaluation metrics (Micro F1, Macro F1, etc.).
2. **Live NER Extraction API:** An endpoint (`POST /ner/extract`) returning detected entities with types and confidences from a given text for the demo.
3. **Update `router.py`** to include these new routers.
