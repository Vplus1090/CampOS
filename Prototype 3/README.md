# 🏕️ CampOS

A modern monorepo powering **CampOS** — built with Express.js, React, and MongoDB.

## Architecture

```
CampOS/
├── packages/
│   ├── backend/          # Express.js API server
│   │   └── src/
│   │       ├── config/   # Database & env configuration
│   │       ├── middleware/# Error handling, auth, etc.
│   │       ├── models/   # Mongoose schemas
│   │       └── routes/   # API route definitions
│   └── frontend/         # React (Vite) client app
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

## Tech Stack

- **Backend**: Node.js, Express.js, Mongoose, Helmet, Morgan
- **Frontend**: React, Vite
- **Database**: MongoDB
- **Monorepo**: npm workspaces

## License

MIT
