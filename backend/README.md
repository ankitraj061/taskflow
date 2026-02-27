# TaskFlow Backend

Express + Socket.IO + Prisma API for the TaskFlow collaborative Kanban app.

## Overview

This service provides:
- Cookie-based authentication (`auth_token` JWT)
- Board, list, task, member, label, and activity APIs
- Real-time board sync via Socket.IO rooms (`board:<boardId>`)
- PostgreSQL persistence through Prisma

## Tech Stack

- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- Socket.IO
- JWT + `cookie-parser`
- CORS for local + production origins

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+
- PostgreSQL database (Neon or local)

## Environment Variables

Create `backend/.env`:

```env
PORT=8000
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
ORIGIN=http://localhost:8080
PRODUCTION_ORIGIN=https://taskflow.ankitraj.fun
PRODUCTION_ORIGIN_2=https://www.taskflow.ankitraj.fun
NODE_ENV=development
```

Notes:
- `ORIGIN`, `PRODUCTION_ORIGIN`, and `PRODUCTION_ORIGIN_2` are used by both HTTP CORS and Socket.IO CORS.
- Cookies are `secure` only when `NODE_ENV=production`.

## Local Development

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev:watch
```

Server default: `http://localhost:8000`

## Scripts

- `npm run dev:watch` - recommended local dev server with `tsx` + `nodemon`
- `npm run dev` - build then run compiled output
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server (`dist/index.js`)
- `npm run seed` - runs `prisma/seed.ts`

## Authentication

Auth endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

How auth works:
- On login/register, API sets `auth_token` cookie (`httpOnly`, `sameSite=strict`, 7d expiry).
- `authMiddleware` validates cookie for protected routes.
- `socketAuth` validates the same cookie during socket handshake.

## API Surface

All routes below are behind `authMiddleware`.

### Boards

- `POST /api/boards` - create board (owner = current user)
- `GET /api/boards?search=&page=&limit=` - paginated board list for owner/member
- `GET /api/boards/:boardId` - fetch board with lists, tasks, labels, assignees
- `PUT /api/boards/:id` - update board (owner or admin member)
- `DELETE /api/boards/:id` - delete board (owner only)
- `GET /api/boards/:boardId/activities` - paginated activity feed

### Members

- `GET /api/boards/:boardId/members` - list members
- `POST /api/boards/:boardId/members` - add member (`checkBoardAdmin`)
- `DELETE /api/boards/:boardId/members/:memberId` - remove member (`checkBoardAdmin`)
- `PATCH /api/boards/:boardId/members/:memberId/role` - change role (`checkBoardAdmin`)

### Lists

- `POST /api/boards/:boardId/lists` - create list
- `PUT /api/boards/:boardId/lists/:listId` - rename list
- `DELETE /api/boards/:boardId/lists/:listId` - delete list
- `POST /api/boards/:boardId/lists/reorder` - reorder lists

### Tasks

- `POST /api/boards/:boardId/lists/:listId/tasks` - create task
- `PUT /api/boards/:boardId/tasks/:taskId` - update task (title/description/startDate/endDate)
- `DELETE /api/boards/:boardId/tasks/:taskId` - delete task
- `POST /api/boards/:boardId/tasks/:taskId/move` - move task between lists
- `POST /api/boards/:boardId/lists/:listId/tasks/reorder` - reorder tasks in list

### Task Assignees

- `POST /api/boards/:boardId/tasks/:taskId/assignees` - assign user to task
- `DELETE /api/boards/:boardId/tasks/:taskId/assignees/:userId` - unassign user

### Task Labels

- `POST /api/boards/:boardId/tasks/:taskId/labels` - add label
- `DELETE /api/boards/:boardId/tasks/:taskId/labels/:labelId` - remove label

## Real-Time Socket Events

### Client -> Server

- `joinBoard(boardId)`
- `leaveBoard(boardId)`

### Server -> Client

Board:
- `boardCreated`
- `boardUpdated`
- `boardDeleted`

List:
- `listCreated`
- `listUpdated`
- `listDeleted`
- `listsReordered`

Task:
- `taskCreated`
- `taskUpdated`
- `taskDeleted`
- `taskMoved`
- `tasksReordered`

Members / metadata:
- `memberAdded`
- `memberRemoved`
- `memberRoleUpdated`
- `labelAdded`
- `labelRemoved`
- `userAssigned`
- `userUnassigned`

Audit:
- `activityCreated`

## Role Model and Access Notes

Roles are defined in Prisma as `ADMIN` and `WORKER`.

Backend enforcement today:
- Board member management requires admin (`checkBoardAdmin`) or owner.
- Board update requires owner or admin member.
- Board delete requires owner.
- List/task endpoints use `checkBoardAccess` (board member access), not strict role filtering.

Frontend UX currently adds stricter behavior for workers:
- Workers can drag and drop only tasks assigned to them.
- Workers do not get task edit actions in the board UI.

## Data Model Highlights

- `Board` owned by `User`, with `BoardMember[]`
- `TaskList` belongs to `Board`
- `Task` belongs to `TaskList` and supports optional `startDate` / `endDate`
- `TaskAssignee` provides many-to-many task assignment
- `Label` is task-scoped (`@@unique([taskId, name])`)
- `Activity` stores typed board events + JSON metadata

See: `backend/prisma/schema.prisma`.

## Project Structure

```txt
backend/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── controller/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Troubleshooting

- `401 Unauthorized`:
  - Ensure frontend uses `withCredentials: true`.
  - Ensure CORS origin matches browser origin exactly.
  - Verify `JWT_SECRET` is set.

- Socket not connecting:
  - Confirm `REACT_APP_API_URL` on frontend points to backend origin.
  - Confirm cookie is present and not blocked by browser policy.

- Prisma issues:
  - Run `npx prisma generate` after schema changes.
  - Run `npx prisma migrate dev` locally.

## Notes

- `prisma/seed.ts` currently contains placeholder/commented code and is not an initialized TaskFlow seed dataset.
- `rateLimitMiddleware.ts` is present but currently commented out / not wired in.
