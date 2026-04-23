# Roles & Permissions

## Roles

1.  **Parent**
    *   **Description**: Primary caregiver managing the account.
    *   **Permissions**:
        *   Manage child profiles (Create, Read, Update, Delete).
        *   Log meals for children.
        *   Grant/Revoke doctor access.
        *   View analytics.
        *   Manage settings.

2.  **Doctor**
    *   **Description**: Pediatrician or Nutritionist.
    *   **Permissions**:
        *   Request access to patient profiles.
        *   View approved patient data (Read-only).
        *   Create prescriptions/notes.
        *   View reports.

3.  **Child (Kids Mode)**
    *   **Description**: Limited view for the child.
    *   **Permissions**:
        *   View own dashboard (Gamified).
        *   Play mini-games.
        *   Chat with AI (Restricted).
        *   **NO** write access to medical data.

## Access Control Implementation

*   **Middleware**: `role.middleware.js` verifies `req.user.role`.
*   **Ownership**: `ownership.middleware.js` ensures parents only access their own children's data.
