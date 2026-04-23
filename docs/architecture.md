# System Architecture

## Overview
NutriKid is a monolithic MERN stack application organized in a monorepo structure.

## Layers

1.  **Frontend (Client)**
    *   **Tech**: React, Vite, Tailwind.
    *   **Responsibility**: UI/UX, State Management (Context API), API consumption (Axios).
    *   **Security**: JWT storage (localStorage/HttpOnly cookie), route protection.

2.  **Backend (API)**
    *   **Tech**: Node.js, Express.
    *   **Responsibility**: Business logic, standard REST API endpoints, Validation (Zod), Authentication/Authorization.
    *   **Security**: Helmet, CORS, Rate Limiting (future), JWT verification.

3.  **Database**
    *   **Tech**: MongoDB.
    *   **Models**: Mongoose schemas with strict typing and validation.

## Data Flow
1.  Client sends request -> Middleware (Cors, Auth) -> Controller -> Service -> Database.
2.  Database responds -> Service processes data -> Controller formats response -> Client receives JSON.
