# 🏕️ CampOS

A modern monorepo powering **CampOS** — built with Express.js, React, and MongoDB.

## Architecture

```
CampOS/
├── api/                  # Vercel Serverless Function (wraps backend)
│   ├── index.js          # Entry point — exports Express app
│   └── app.js            # Express app configured for serverless
├── packages/
│   ├── backend/          # Express.js API server
│   │   └── src/
│   │       ├── config/   # Database & env configuration
│   │       ├── middleware/# Error handling, auth, etc.
│   │       ├── models/   # Mongoose schemas
│   │       └── routes/   # API route definitions
│   └── frontend/         # React (Vite) client app
├── vercel.json           # Vercel deployment config
├── package.json          # Workspace root
└── .env.example          # Environment variable template
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally (or a connection URI)

### Setup

```bash
# 1. Clone & install
git clone <repo-url> && cd CampOS
npm install

# 2. Configure environment
cp .env.example packages/backend/.env

# 3. Start development servers (backend + frontend)
npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:5000        |
| Health   | http://localhost:5000/api/health |

## Scripts

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Start both backend & frontend        |
| `npm run dev:backend`| Start backend only (with hot-reload) |
| `npm run dev:frontend`| Start frontend only                 |
| `npm run build`      | Build frontend for production        |
| `npm start`          | Start backend in production mode     |

## Deploy to Vercel

### 1. Set up MongoDB Atlas

Create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and get your connection string.

### 2. Deploy

Push your repo to GitHub, then import it in the [Vercel Dashboard](https://vercel.com/new).

### 3. Configure Environment Variables

In **Vercel → Project Settings → Environment Variables**, add:

| Variable             | Value                                    |
|----------------------|------------------------------------------|
| `MONGODB_URI`        | Your Atlas connection string             |
| `JWT_ACCESS_SECRET`  | Random 64-char hex string                |
| `JWT_REFRESH_SECRET` | Another random 64-char hex string        |
| `CORS_ORIGIN`        | Your deployment URL (e.g. `https://campos.vercel.app`) |
| `NODE_ENV`           | `production`                             |

> **Tip**: Generate secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### How it works

- **Frontend**: Vite builds to `packages/frontend/dist/` and is served as static files
- **Backend**: The Express app in `api/` runs as a Vercel Serverless Function
- **Routing**: `vercel.json` rewrites `/api/*` to the serverless function, everything else serves the SPA

## Tech Stack

- **Backend**: Node.js, Express.js, Mongoose, Helmet, Morgan
- **Frontend**: React, Vite
- **Database**: MongoDB
- **Monorepo**: npm workspaces
- **Hosting**: Vercel (Serverless Functions + Static)

## License

MIT
