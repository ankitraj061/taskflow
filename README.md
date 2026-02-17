# TaskFlow

A real-time collaborative Kanban board application for managing projects and tasks across teams.

🌐 **Live:** https://taskflow.ankitraj.fun

---

## 🔐 Demo Login

| Email            | Password  |
|------------------|-----------|
| hintro@gmail.com | Hintro@12 |

---

## ✨ What is TaskFlow?

TaskFlow is a project management tool inspired by Trello. Teams can create boards, organize tasks into lists, assign work to members, and track progress — all updating in real time across every connected user without needing to refresh the page.

---

## 🚀 Features

- **Real-Time Sync** — All actions reflect instantly for every user on the board via Socket.IO
- **Drag & Drop** — Move tasks between lists with smooth drag and drop
- **Role-Based Access** — Admins manage the board; Workers can only move their own assigned tasks
- **Team Members** — Invite members by email and assign roles
- **Labels** — Color-coded labels to categorize tasks
- **Activity Log** — Live feed of everything happening on the board
- **Pagination & Search** — Quickly find boards from the dashboard

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React, TypeScript, Vite, TailwindCSS    |
| State       | Zustand                                 |
| Real-Time   | Socket.IO                               |
| Drag & Drop | @dnd-kit                                |
| UI          | shadcn/ui                               |
| Backend     | Node.js, Express, TypeScript            |
| Database    | PostgreSQL (Neon) via Prisma ORM        |
| Auth        | JWT stored in HTTP-only cookies         |
| Hosting     | Vercel (frontend) + AWS (backend)       |

---

## 🗂️ Project Structure

```
TaskFlow/
├── frontend/     # React app — see frontend/README.md
└── backend/      # Express + Socket.IO server — see backend/README.md
```

For detailed setup instructions, see:
- [`frontend/README.md`](./frontend/README.md)
- [`backend/README.md`](./backend/README.md)

---

## ⚡ How Real-Time Works

Every action a user takes (creating a task, moving a card, adding a member) is sent to the server via REST API. The server saves it to the database and immediately emits a Socket.IO event to all users currently viewing the same board — their UI updates automatically.

---

## 📄 License

MIT