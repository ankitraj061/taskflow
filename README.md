# TaskFlow

TaskFlow is a real-time collaborative Kanban application for teams.

Live: https://taskflow.ankitraj.fun

## Demo Login

| Email            | Password  |
|------------------|-----------|
| hintro@gmail.com | Hintro@12 |

## Features

- Real-time updates with Socket.IO for boards, lists, tasks, members, labels, and activity feed
- Drag-and-drop task movement with role checks (workers can move only tasks assigned to them)
- Board member management with roles (`ADMIN`, `WORKER`)
- Task details modal with description, assignees, labels, and date range (`startDate`, `endDate`)
- Date-aware task UI (overdue/today/upcoming indicators)
- Board dashboard search + pagination
- JWT cookie authentication with protected API + socket connections

## Tech Stack

- Frontend: React, TypeScript, Vite, TailwindCSS, shadcn/ui, Zustand, @dnd-kit
- Backend: Node.js, Express, TypeScript, Socket.IO
- Database: PostgreSQL (Neon) with Prisma
- Auth: JWT in HTTP-only cookies

## Project Structure

```txt
TaskFlow/
├── frontend/   # React app
└── backend/    # Express + Socket.IO API
```

Detailed setup:

- `frontend/README.md`
- `backend/README.md`

## Quick Start (Local)

1. Start backend (`http://localhost:8000`)
2. Start frontend (`http://localhost:8080`)
3. Open the frontend and log in

See folder-specific READMEs for full environment variable and command details.

## License

MIT
