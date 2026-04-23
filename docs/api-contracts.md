# API Contracts

## Authentication

### Register
**POST** `/api/auth/register`
**Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "parent" // 'parent' or 'doctor'
}
```
**Response (201)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "role": "parent" },
    "token": "jwt_token_string"
  }
}
```

### Login
**POST** `/api/auth/login`
**Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "role": "parent" },
    "token": "jwt_token_string"
  }
}
```

### Get Current User
**GET** `/api/auth/me`
**Headers**: `Authorization: Bearer <token>`
**Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "role": "parent" }
  }
}
```
