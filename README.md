# TaskFlow

TaskFlow is a full-stack, real-time Kanban collaboration platform with role-based team workflows.

Live: https://taskflow.ankitraj.fun

## What It Does

- Create and manage boards with members and roles (`ADMIN`, `WORKER`)
- Organize work into lists and draggable tasks
- Assign users, add labels, and track task dates
- Keep all connected clients in sync through Socket.IO events
- Maintain a board activity feed for audit visibility

## Current Role Behavior

- `ADMIN`: full board control in UI (members, lists, task editing)
- `WORKER`: can drag/drop only tasks assigned to them and does not get task edit actions in board UI

## Monorepo Structure

```txt
TaskFlow/
├── frontend/   # React + Vite client
└── backend/    # Express + Prisma + Socket.IO API
```

## Tech Stack

Frontend:
- React 18, TypeScript, Vite
- Zustand, Axios, Socket.IO client
- @dnd-kit, TailwindCSS, shadcn/ui

Backend:
- Node.js, Express 5, TypeScript
- Prisma + PostgreSQL
- Socket.IO
- JWT auth in HTTP-only cookies

## Quick Start (Local)

### 1. Start Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev:watch
```

Backend runs on `http://localhost:8000` by default.

### 2. Start Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:8080` by default.

### 3. Configure Environment Variables

Backend (`backend/.env`):

```env
PORT=8000
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
ORIGIN=http://localhost:8080
PRODUCTION_ORIGIN=https://taskflow.ankitraj.fun
PRODUCTION_ORIGIN_2=https://www.taskflow.ankitraj.fun
NODE_ENV=development
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
```

## Feature Highlights

- Real-time board/list/task/member/label sync
- Board search + pagination
- Drag-and-drop with optimistic updates
- Member management + role updates
- Activity timeline sidebar
- Date-aware task indicators (overdue/today/upcoming)
- Cookie-based auth shared by HTTP and WebSocket

## Detailed Documentation

- Backend docs: `backend/README.md`
- Frontend docs: `frontend/README.md`

## License

MIT
