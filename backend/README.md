# TaskFlow Backend

Express + Socket.IO + Prisma API for TaskFlow.

## Stack

- Node.js + Express + TypeScript
- Socket.IO
- Prisma + PostgreSQL (Neon)
- JWT auth in HTTP-only cookie (`auth_token`)

## Local Setup

1. Install:

```bash
cd backend
npm install
```

2. Create `.env`:

```env
PORT=8000
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=replace_with_a_strong_secret
ORIGIN=http://localhost:8080
PRODUCTION_ORIGIN=https://taskflow.ankitraj.fun
PRODUCTION_ORIGIN_2=https://www.taskflow.ankitraj.fun
```

3. Prepare DB:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Start API:

```bash
npm run dev
```

Runs on `http://localhost:8000`.

## Scripts

- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server
- `npm run dev` - build then start
- `npm run dev:watch` - watch-mode dev server using `tsx`
- `npm run seed` - run `prisma/seed.ts`

## API Overview

Base paths:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/boards` (supports `search`, `page`, `limit`)
- `POST /api/boards`
- `GET /api/boards/:boardId`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`
- `GET /api/boards/:boardId/activities`
- `GET /api/boards/:boardId/members`
- `POST /api/boards/:boardId/members`
- `DELETE /api/boards/:boardId/members/:memberId`
- `PATCH /api/boards/:boardId/members/:memberId/role`
- `POST /api/boards/:boardId/lists`
- `PUT /api/boards/:boardId/lists/:listId`
- `DELETE /api/boards/:boardId/lists/:listId`
- `POST /api/boards/:boardId/lists/reorder`
- `POST /api/boards/:boardId/lists/:listId/tasks`
- `PUT /api/boards/:boardId/tasks/:taskId`
- `DELETE /api/boards/:boardId/tasks/:taskId`
- `POST /api/boards/:boardId/tasks/:taskId/move`
- `POST /api/boards/:boardId/lists/:listId/tasks/reorder`
- `POST /api/boards/:boardId/tasks/:taskId/assignees`
- `DELETE /api/boards/:boardId/tasks/:taskId/assignees/:userId`
- `POST /api/boards/:boardId/tasks/:taskId/labels`
- `DELETE /api/boards/:boardId/tasks/:taskId/labels/:labelId`

## Socket Events

Client -> server:

- `joinBoard(boardId)`
- `leaveBoard(boardId)`

Server -> clients:

- Board lifecycle: `boardCreated`, `boardUpdated`, `boardDeleted`
- List lifecycle: `listCreated`, `listUpdated`, `listDeleted`, `listsReordered`
- Task lifecycle: `taskCreated`, `taskUpdated`, `taskDeleted`, `taskMoved`, `tasksReordered`
- Collaboration: `memberAdded`, `memberRemoved`, `memberRoleUpdated`
- Task metadata: `labelAdded`, `labelRemoved`, `userAssigned`, `userUnassigned`
- Activity stream: `activityCreated`

## Data Model Notes

- `Task` supports optional `startDate` and `endDate`
- Role model: `BoardRole = ADMIN | WORKER`
- Activity log stores typed events with JSON metadata

## Auth and CORS Notes

- HTTP routes and sockets both validate `auth_token`
- `socketAuth` parses JWT from cookie header and attaches the user to `socket.data.user`
- CORS origins are read from `ORIGIN`, `PRODUCTION_ORIGIN`, and `PRODUCTION_ORIGIN_2`

## Deployment Notes

- Open backend port (default `8000`)
- If using Nginx, forward WebSocket upgrade headers
- Use PM2/systemd to keep `dist/index.js` running
