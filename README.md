<<<<<<< HEAD
# RoutePilot — Ready-to-Deploy Full Stack

This package converts the RoutePilot single-file prototype into a Node/Express backend with SQLite persistence, JWT authentication, password hashing, password requests, contacts and audit logging. The original UI is kept in `index.html`.

## Local run

1. Install Node.js 20+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and change `JWT_SECRET`.
5. Run `npm start`.
6. Open `http://localhost:10000`.

### Demo accounts

- Owner: `owner` / `Owner@123`
- Operator: `OP-01` / `Operator@123`
- Operator: `OP-02` / `Operator@123`
- Driver: `T-01` to `T-10` / `Driver@123`
- Customer: `C-01` to `C-10` / `Customer@123`

**Change these passwords before a real deployment/demo.**

## Render deployment

The included `render.yaml` creates a Node web service and a 1 GB persistent disk for SQLite.

1. Push this folder to GitHub.
2. In Render, create a Blueprint from the repository.
3. Render reads `render.yaml`, installs dependencies and starts `npm start`.
4. `JWT_SECRET` is generated automatically.
5. The database is stored at `/var/data/routepilot.db`.

## API

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/state`
- `PUT /api/state`
- `POST /api/password-requests`
- `GET /api/password-requests`
- `GET /api/audit`
- `PUT /api/users/:id/contact`
- `POST /api/users/:id/password`

The browser should call these endpoints with `Authorization: Bearer <token>` after login.
=======
# ROUTEPILOT
>>>>>>> 5dbba5b762458e7d0019eba25c26687389deff46
