# TaskFlow Frontend

React + TypeScript Kanban frontend with real-time Socket.IO sync.

Live: https://taskflow.ankitraj.fun

## Stack

- React + TypeScript + Vite
- Zustand state stores
- Socket.IO client
- @dnd-kit for drag and drop
- TailwindCSS + shadcn/ui
- Axios + TanStack React Query

## Local Setup

1. Install:

```bash
cd frontend
npm install
```

2. Create `.env`:

```env
VITE_API_URL=http://localhost:8000
REACT_APP_API_URL=http://localhost:8000
```

`VITE_API_URL` is used by Axios, and `REACT_APP_API_URL` is used by `SocketContext`.

3. Start:

```bash
npm run dev
```

Frontend runs on `http://localhost:8080`.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## Main Features

- Login/signup with cookie-based auth flow
- Dashboard with search, pagination, create/edit/delete board actions
- Real-time board state syncing through socket event handlers in Zustand stores
- Drag-and-drop task movement with optimistic updates
- Member management modal (add/remove/change role)
- Task detail modal:
- Edit title and description
- Set `startDate` and `endDate` with validations
- Manage labels and assignees
- Delete task
- Activity sidebar with latest board actions
- Live connection indicator on dashboard

## Routes

- `/` -> redirects to `/login`
- `/login`
- `/signup`
- `/dashboard`
- `/boards/:boardId`
- `*` -> not found page

## Structure

```txt
frontend/src/
├── client/          # axios client setup
├── components/      # board/task/ui components
├── contexts/        # auth + socket providers
├── layouts/         # shared app layout
├── pages/           # route pages
├── stores/          # zustand stores (boards + board detail)
├── test/            # vitest setup/example
└── types/           # shared app types
```

## Deployment Notes

For Vercel (or similar), configure:

```env
VITE_API_URL=https://your-backend-domain
REACT_APP_API_URL=https://your-backend-domain
```
