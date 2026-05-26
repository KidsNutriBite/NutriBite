# How to Start the Project

This guide provides instructions on how to start the NutriBite platform locally. The project consists of three main components:
- **Frontend** (React/Next.js)
- **Backend API** (Node.js/Express)
- **AI Service** (Python/FastAPI)

## Prerequisites

Make sure you have installed:
- Node.js (v18+)
- Python (v3.9+)

## 1. Start the Frontend & Backend

The frontend and Node.js backend are configured to run concurrently from the root directory.

1. Open a terminal and navigate to the project root directory:
   ```bash
   cd NutriBite-main
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```

This command will start:
- **Frontend** on `http://localhost:3000`
- **Backend** on `http://localhost:5000`

## 2. Start the AI Service

The AI service handles the advanced gamification, chatbot, and RAG features. It runs separately using a Python virtual environment.

1. Open a **new** terminal window/tab.
2. Navigate to the `ai-service` directory:
   ```bash
   cd NutriBite-main/ai-service
   ```
3. (Optional) Activate the virtual environment if you haven't:
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
4. Run the Python application:
   ```bash
   # If you are using the virtual environment directly:
   venv\Scripts\python.exe main.py
   
   # Or using uvicorn directly if activated:
   uvicorn main:app --reload
   ```

This will start the **AI Service API** on `http://127.0.0.1:8000`.

## 3. Verify Running Services

You should now have three services running:
- **Frontend Interface:** [http://localhost:3000](http://localhost:3000)
- **Backend Server:** [http://localhost:5000](http://localhost:5000)
- **AI Service:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
