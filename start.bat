@echo off
if "%1"=="project" (
    echo Starting frontend and backend...
    npm run start-project
) else if "%1"=="frontend" (
    echo Starting frontend...
    npm run start-frontend
) else if "%1"=="backend" (
    echo Starting backend...
    npm run start-backend
) else (
    echo Usage:
    echo   .\start project   - Start both frontend and backend
    echo   .\start frontend  - Start only frontend
    echo   .\start backend   - Start only backend
)
