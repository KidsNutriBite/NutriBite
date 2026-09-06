@echo off
if "%1"=="project" (
    echo Starting frontend, backend, and nutrikid_Agentic AI...
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
) else (
    echo Usage:
    echo   run project   - Start frontend, backend, and AI together
    echo   run ai        - Start only nutrikid_Agentic AI
    echo   run frontend  - Start only frontend
    echo   run backend   - Start only backend
)
