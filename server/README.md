# MONE AI Backend

## Run
```bash
npm install
cp .env.example .env
npm run seed:admin
npm run dev
```

## Starter endpoints
- POST `/api/v1/auth/admin/login`
- GET `/api/v1/admin/dashboard`
- GET `/api/v1/admin/users`
- GET `/api/v1/admin/users/:id`
- PATCH `/api/v1/admin/users/:id/status`
- GET/POST `/api/v1/finance/transactions`
- GET/POST `/api/v1/health/metrics`
- GET/POST/PATCH/DELETE `/api/v1/todos`
- GET/PUT `/api/v1/widgets/layout`
- GET/POST `/api/v1/ai/usage`
- GET/POST `/api/v1/notifications`
- GET `/api/v1/subscriptions/me`
- GET `/api/v1/subscriptions`
- GET `/api/v1/app-config/public`
- GET/PATCH `/api/v1/admin/app-config`
- PATCH `/api/v1/admin/feature-flags`

Before production add request validation, rate limiting, refresh tokens, password reset, email verification, tests, structured logging, encryption strategy for sensitive data, backups, and monitoring.
