@echo off
if "%1"=="project" (
    echo Starting frontend, backend, nutrikid_Agentic AI, and food vision AI...
    npm run start-project
) else if "%1"=="frontend" (
    echo Starting frontend...
    npm run start-frontend
) else if "%1"=="backend" (
    echo Starting backend...
    npm run start-backend
) else if "%1"=="ai" (
    echo Starting nutrikid_Agentic AI...
    npm run start-ai
) else if "%1"=="vision" (
    echo Starting food recognition vision AI...
    npm run start-vision
) else (
    echo Usage:
    echo   run project   - Start frontend, backend, and all AI services together
    echo   run vision    - Start only food recognition YOLO model (port 8001)
    echo   run ai        - Start only nutrikid_Agentic AI (port 8000)
    echo   run frontend  - Start only frontend
    echo   run backend   - Start only backend
)
