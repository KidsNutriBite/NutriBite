#!/bin/bash
if [ "$1" = "project" ]; then
    echo "Starting frontend and backend..."
    npm run start-project
elif [ "$1" = "frontend" ]; then
    echo "Starting frontend..."
    npm run start-frontend
elif [ "$1" = "backend" ]; then
    echo "Starting backend..."
    npm run start-backend
else
    echo "Usage:"
    echo "  ./run.sh project   - Start both frontend and backend"
    echo "  ./run.sh frontend  - Start only frontend"
    echo "  ./run.sh backend   - Start only backend"
fi
