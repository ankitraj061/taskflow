# TaskFlow — Frontend

React + TypeScript Kanban board frontend with real-time updates via Socket.IO. Hosted on **Vercel**.

🌐 **Live URL:** https://taskflow.ankitraj.fun

---

## 🔐 Demo Credentials

| Field    | Value            |
|----------|------------------|
| Email    | hintro@gmail.com |
| Password | Hintro@12        |

---

## ⚙️ Tech Stack

- React + TypeScript (Vite)
- Zustand — state management
- Socket.IO Client — real-time sync
- @dnd-kit — drag and drop
- TailwindCSS + shadcn/ui
- React Router v6
- Axios — HTTP client
- Tanstack React Query

---

## 🛠️ Local Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Create `.env` file

```env
VITE_API_URL=http://localhost:8000
```

> For production this points to your AWS backend URL.

### 3. Start dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## 🗂️ Project Structure

```
frontend/
└── src/
    ├── client/
    │   └── axiosClient.ts         # Axios instance with base URL + credentials
    ├── components/
    │   ├── ActivitySidebar.tsx    # Real-time activity feed sidebar
    │   ├── BoardCard.tsx          # Board card on dashboard
    │   ├── CreateBoardModal.tsx   # Modal to create a new board
    │   ├── KanbanList.tsx         # A single kanban column
    │   ├── ManageMembersModal.tsx # Add/remove/role members
    │   ├── TaskCardOverlay.tsx    # Drag overlay card
    │   └── TaskDetailsModal.tsx   # Task detail view modal
    ├── contexts/
    │   ├── AuthContext.tsx        # Login/logout/user state
    │   └── SocketContext.tsx      # Socket.IO connection + isConnected state
    ├── layouts/
    │   └── AppLayout.tsx          # Shared page layout
    ├── pages/
    │   ├── Login.tsx              # Login page
    │   ├── Signup.tsx             # Register page
    │   ├── Dashboard.tsx          # All boards view
    │   └── BoardView.tsx          # Kanban board page
    ├── stores/
    │   ├── useBoardStore.ts       # Single board state + socket handlers
    │   └── useBoardsStore.ts      # All boards list state + socket handlers
    └── types/
        └── board.types.ts         # Shared TypeScript types
```

---

## 🧭 Routes

| Route             | Page        | Description                  |
|-------------------|-------------|------------------------------|
| `/`               | Redirect    | Redirects to `/login`        |
| `/login`          | Login       | Sign in with email/password  |
| `/signup`         | Signup      | Create new account           |
| `/dashboard`      | Dashboard   | View and manage all boards   |
| `/boards/:boardId`| BoardView   | Kanban board with DnD        |

---

## ⚡ Real-Time Architecture

The frontend uses **two Zustand stores** that each hold a socket reference:

- `useBoardsStore` — handles `boardCreated`, `boardUpdated`, `boardDeleted` events on the Dashboard
- `useBoardStore` — handles all task/list/member/label events inside a Board

### Socket wiring in `BoardView.tsx`

```tsx
// 1. Wire socket handlers to store
useEffect(() => {
  setSocket(socket);
  return () => setSocket(null);
}, [socket]);

// 2. Fetch board data on mount
useEffect(() => {
  if (!boardId) return;
  fetchBoard(boardId);
  fetchActivities(boardId);
  return () => clearBoard();
}, [boardId]);

// 3. Join/leave board room
useEffect(() => {
  if (!socket || !boardId) return;
  socket.emit("joinBoard", boardId);
  return () => socket.emit("leaveBoard", boardId);
}, [socket, boardId]);
```

---

## ⏳ Important — Wait After Actions

After clicking any button (move task, add member, assign user, etc.) **please wait 1–2 seconds** before performing another action. This allows the Socket.IO event to propagate to all connected clients.

> If testing with two browser windows on the same board, act in window A then wait briefly — window B will update automatically without refreshing.

---

## 👥 Role-Based Permissions

| Role   | Can do                                               |
|--------|------------------------------------------------------|
| ADMIN  | Full access — create/edit/delete lists, tasks, members, drag any task |
| WORKER | Can only drag/move tasks that are **assigned to them** |

---

## 🚀 Deployment (Vercel)

The frontend is deployed on Vercel.

### Environment variable to set in Vercel dashboard:

```env
VITE_API_URL=https://your-aws-backend-url
```

### Build settings:
- **Framework:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

---

## 🧪 Testing Real-Time

1. Open `https://taskflow.ankitraj.fun` in two different browsers (or normal + incognito)
2. Log in with different accounts on each
3. Have both open the **same board**
4. Perform an action on one — the other updates automatically
5. The green **Live** dot on the Dashboard confirms socket is connected

---

## 🐛 Known Behaviors

- Drag and drop updates **optimistically** for the person dragging — socket then syncs to others
- If the socket disconnects, the green Live indicator disappears — refresh to reconnect
- Cookie-based auth (`auth_token` HTTP-only cookie) is used — no localStorage tokens