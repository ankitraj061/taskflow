# TaskFlow Frontend

React + TypeScript Kanban client for TaskFlow, with real-time collaboration over Socket.IO.

Live app: https://taskflow.ankitraj.fun

## Overview

The frontend provides:
- Auth flows (login, signup, logout) using HTTP-only cookie sessions
- Board dashboard with search + pagination
- Real-time board collaboration (lists, tasks, members, labels, activity)
- Drag-and-drop task movement with role-aware behavior
- Role-aware member and task management UI

## Tech Stack

- React 18 + TypeScript + Vite
- Zustand stores for board data and socket event application
- Socket.IO client for real-time sync
- `@dnd-kit` for task drag-and-drop
- TailwindCSS + shadcn/ui + Lucide icons
- Axios for API communication
- Vitest + Testing Library (basic test setup)

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+
- Running backend API (default `http://localhost:8000`)

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
```

Usage:
- `VITE_API_URL` -> Axios base URL (`src/client/axiosClient.ts`)
- `REACT_APP_API_URL` -> Socket.IO server URL (`src/contexts/SocketContext.tsx`)

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Dev server default: `http://localhost:8080`

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run build:dev` - build in development mode
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## Routing

Configured in `src/App.tsx`:

- `/` -> redirect to `/login`
- `/login`
- `/signup`
- `/dashboard`
- `/boards/:boardId`
- `*` -> not found page

## Key Features

### Authentication

- Register/login call backend auth endpoints.
- Backend sets `auth_token` cookie.
- `AuthContext` checks session with `GET /api/auth/me` on app load.

### Board Dashboard

- Fetches boards with pagination and search.
- Search input is debounced in Zustand store.
- Supports board create/edit/delete.
- Shows live connection status indicator when socket is connected.

### Board View

- Loads board lists/tasks + activity.
- Joins board room using `joinBoard(boardId)`.
- Applies live socket events to local Zustand state.
- Task movement is optimistic and then confirmed by API/socket.

### Role-Aware UX

Current UI behavior:
- `ADMIN` users can manage members, lists, and task editing actions.
- `WORKER` users can drag-and-drop only tasks assigned to them.
- Workers do not get task edit controls in task details modal.

### Task Capabilities

- Title + description display/edit (admin UI)
- Start/end date fields with validations and status badges
- Label add/remove
- Assignee add/remove
- Task move across lists and within list
- Activity stream for board events

## State Architecture

- `AuthContext`:
  - session state (`user`, `loading`)
  - auth actions (`login`, `register`, `logout`, `checkAuth`)

- `SocketContext`:
  - socket lifecycle based on auth state
  - connection status (`isConnected`)

- `useBoardsStore`:
  - dashboard boards list + search + pagination
  - board-level socket events (`boardCreated`, `boardUpdated`, `boardDeleted`)

- `useBoardStore`:
  - active board detail state (`lists`, `activities`, `currentUserRole`)
  - list/task/member/label actions
  - board-room socket events for collaboration

## Socket Events Consumed

- Board: `boardCreated`, `boardUpdated`, `boardDeleted`
- Lists: `listCreated`, `listUpdated`, `listDeleted`, `listsReordered`
- Tasks: `taskCreated`, `taskUpdated`, `taskDeleted`, `taskMoved`, `tasksReordered`
- Members: `memberAdded`, `memberRemoved`, `memberRoleUpdated`
- Task metadata: `labelAdded`, `labelRemoved`, `userAssigned`, `userUnassigned`
- Activity: `activityCreated`

## Project Structure

```txt
frontend/
├── public/
├── src/
│   ├── client/      # axios instance
│   ├── components/  # UI and board/task components
│   ├── contexts/    # auth + socket providers
│   ├── layouts/     # app shell layout
│   ├── pages/       # route pages
│   ├── stores/      # zustand stores
│   ├── test/        # vitest setup/tests
│   └── types/       # TypeScript domain types
├── package.json
└── vite.config.ts
```

## Deployment Notes

Set production frontend env values:

```env
VITE_API_URL=https://your-api-domain
REACT_APP_API_URL=https://your-api-domain
```

Also ensure backend CORS origin list includes your frontend origin(s).

## Known Notes

- Login page currently has prefilled credentials in component state for local convenience.
- There is no separate route guard wrapper; auth behavior is managed through context calls and page-level flow.
