# Mone AI - Web Application & Admin Dashboard

Modern web platform for Mone AI featuring a full-featured user console, an administrative analytics dashboard, and a robust Node/Express/MongoDB API server.

## Project Structure

```
.
├── admin/          # React + Vite frontend application (User Console & Admin Dashboard)
└── server/         # Express.js + MongoDB backend API server
```

## Getting Started

### 1. Backend Server (`server`)

```bash
cd server
npm install
cp .env.example .env     # Configure your MongoDB URI & JWT secret
npm run dev              # Starts API on http://localhost:5001
```

### 2. Frontend Client (`admin`)

```bash
cd admin
npm install
cp .env.example .env     # Sets VITE_API_URL=http://localhost:5001/api/v1
npm run dev              # Starts frontend dev server on http://localhost:5173
```

## Features

- **User Module**: Finance management (accounts, transactions, budgets, goals, statement import), Health & Vital tracking, Medicine schedules, AI insights, customizable Widgets, and To-Dos.
- **Admin Console**: User management, AI usage & token analytics, platform configurations, system notification broadcasts, role-based access control (Super Admin, Admin, Support, Analyst).
- **Backend Services**: Secure JWT authentication with refresh sessions, REST APIs, MongoDB Mongoose models, and bank statement processing.HI
