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
    echo   .\start project   - Start frontend, backend, and AI together
    echo   .\start ai        - Start only nutrikid_Agentic AI
    echo   .\start frontend  - Start only frontend
    echo   .\start backend   - Start only backend
)
