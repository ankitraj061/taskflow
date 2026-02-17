# TaskFlow — Backend

Node.js + Express + Socket.IO backend with Prisma ORM and PostgreSQL (Neon). Hosted on **AWS**.

---

## ⚙️ Tech Stack

- Node.js + Express + TypeScript
- Socket.IO — real-time WebSocket server
- Prisma ORM — database access
- PostgreSQL (Neon serverless)
- JWT — authentication via HTTP-only cookies
- bcryptjs — password hashing

---

## 🛠️ Local Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` file

```env
PORT=8000
DATABASE_URL=postgresql://your_user:your_password@your_host/your_db?sslmode=require
JWT_SECRET=your_jwt_secret_here
ORIGIN=http://localhost:5173
PRODUCTION_ORIGIN=https://taskflow.ankitraj.fun
PRODUCTION_ORIGIN_2=https://www.taskflow.ankitraj.fun
```

### 3. Run Prisma migrations

```bash
npx prisma migrate dev
```

### 4. Start dev server

```bash
npm run dev
```

Server runs at `http://localhost:8000`

> `npm run dev` runs `tsc -b` then `node dist/index.js` — always recompile after changes.

---

## 🗂️ Project Structure

```
backend/
└── src/
    ├── controller/
    │   ├── auth.controller.ts         # Register, login, logout, checkAuth
    │   ├── board.controller.ts        # CRUD for boards + activities
    │   ├── boardMember.controller.ts  # Add/remove/update board members
    │   ├── task.controller.ts         # Task CRUD, move, reorder, labels, assignees
    │   └── taskList.controller.ts     # List CRUD + reorder
    ├── middleware/
    │   ├── authMiddleware.ts          # JWT cookie verification for HTTP routes
    │   ├── boardAccess.ts             # checkBoardAccess + checkBoardAdmin guards
    │   └── socketAuth.ts              # JWT cookie verification for Socket.IO
    ├── routes/
    │   ├── auth.route.ts              # /api/auth/* routes
    │   └── board.route.ts             # /api/boards/* routes
    ├── db/
    │   └── prisma.ts                  # Prisma client instance
    ├── utils/
    │   └── activity.ts                # createActivity helper
    └── index.ts                       # Express + Socket.IO server entry point
```

---

## 🌐 API Routes

### Auth — `/api/auth`

| Method | Route        | Description           |
|--------|--------------|-----------------------|
| POST   | `/login`     | Login, sets cookie    |
| POST   | `/register`  | Register new user     |
| GET    | `/me`        | Check auth status     |
| POST   | `/logout`    | Clear auth cookie     |

### Boards — `/api/boards` (all require auth)

| Method | Route                                        | Description              |
|--------|----------------------------------------------|--------------------------|
| GET    | `/`                                          | Get all boards (paginated)|
| POST   | `/`                                          | Create board             |
| GET    | `/:boardId`                                  | Get single board         |
| PUT    | `/:id`                                       | Update board             |
| DELETE | `/:id`                                       | Delete board             |
| GET    | `/:boardId/activities`                       | Get board activity log   |
| GET    | `/:boardId/members`                          | Get members              |
| POST   | `/:boardId/members`                          | Add member (admin only)  |
| DELETE | `/:boardId/members/:memberId`                | Remove member            |
| PATCH  | `/:boardId/members/:memberId/role`           | Update member role       |
| POST   | `/:boardId/lists`                            | Create list              |
| PUT    | `/:boardId/lists/:listId`                    | Update list              |
| DELETE | `/:boardId/lists/:listId`                    | Delete list              |
| POST   | `/:boardId/lists/reorder`                    | Reorder lists            |
| POST   | `/:boardId/lists/:listId/tasks`              | Create task              |
| PUT    | `/:boardId/tasks/:taskId`                    | Update task              |
| DELETE | `/:boardId/tasks/:taskId`                    | Delete task              |
| POST   | `/:boardId/tasks/:taskId/move`               | Move task to another list|
| POST   | `/:boardId/lists/:listId/tasks/reorder`      | Reorder tasks in list    |
| POST   | `/:boardId/tasks/:taskId/assignees`          | Assign user to task      |
| DELETE | `/:boardId/tasks/:taskId/assignees/:userId`  | Unassign user            |
| POST   | `/:boardId/tasks/:taskId/labels`             | Add label to task        |
| DELETE | `/:boardId/tasks/:taskId/labels/:labelId`    | Remove label             |

---

## ⚡ Socket.IO Events

### Server listens for (from client):

| Event       | Payload     | Description                        |
|-------------|-------------|------------------------------------|
| `joinBoard` | `boardId`   | Client joins a board room          |
| `leaveBoard`| `boardId`   | Client leaves a board room         |

### Server emits to `board:{boardId}` room:

| Event              | Payload                                              |
|--------------------|------------------------------------------------------|
| `listCreated`      | `TaskList`                                           |
| `listUpdated`      | `TaskList`                                           |
| `listDeleted`      | `listId: string`                                     |
| `taskCreated`      | `{ task: Task, listId: string }`                     |
| `taskUpdated`      | `Task`                                               |
| `taskDeleted`      | `{ taskId: string, listId: string }`                 |
| `taskMoved`        | `{ task: Task, sourceListId: string, destinationListId: string }` |
| `tasksReordered`   | `{ listId: string, taskIds: string[] }`              |
| `memberAdded`      | `BoardMember`                                        |
| `memberRemoved`    | `memberId: string`                                   |
| `memberRoleUpdated`| `BoardMember`                                        |
| `activityCreated`  | `Activity`                                           |
| `labelAdded`       | `{ taskId: string, label: Label }`                   |
| `labelRemoved`     | `{ taskId: string, labelId: string }`                |
| `userAssigned`     | `{ taskId: string, assignee: TaskAssignee }`         |
| `userUnassigned`   | `{ taskId: string, userId: string }`                 |

---

## 🔐 Authentication

- JWT token signed with `JWT_SECRET`, expires in 7 days
- Stored in an **HTTP-only cookie** named `auth_token`
- Cookie settings:
  - `httpOnly: true`
  - `secure: true` in production
  - `sameSite: strict`

### Socket Authentication (`socketAuth.ts`)

Socket.IO connections are authenticated by reading the `auth_token` cookie from the handshake headers:

```ts
const tokenCookie = cookies
  .split(";")
  .find((c) => c.trim().startsWith("auth_token="));

const token = tokenCookie.split("=").slice(1).join("=").trim();
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
```

> The `.slice(1).join("=")` handles JWT tokens that contain `=` padding characters.

---

## 🚀 Deployment (AWS)

The backend is hosted on AWS.

### Key things to ensure on your AWS instance:

1. **Environment variables** are set (PORT, DATABASE_URL, JWT_SECRET, ORIGIN, PRODUCTION_ORIGIN)
2. **Port 8000** is open in your security group inbound rules
3. If using a reverse proxy (nginx), ensure it proxies **WebSocket upgrades**:

```nginx
location / {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

4. Use **PM2** to keep the server running:

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name taskflow-backend
pm2 save
pm2 startup
```

---

## 🗄️ Database (Neon PostgreSQL)

The project uses **Neon** serverless PostgreSQL.

```bash
# Run migrations
npx prisma migrate dev

# Open Prisma Studio to inspect DB
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate
```

---

## 🐛 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `Authentication error: No token` | Cookie name mismatch in `socketAuth.ts` | Ensure looking for `auth_token=` not `token=` |
| `Authentication error: Invalid token` | JWT split on `=` loses padding | Use `.slice(1).join("=")` to extract token value |
| Socket connects but no events received | Client never emits `joinBoard` | Ensure `socket.emit("joinBoard", boardId)` is called in `BoardView` |
| CORS error on socket | Origin not in allowed list | Add your frontend URL to `ORIGIN` or `PRODUCTION_ORIGIN` in `.env` |