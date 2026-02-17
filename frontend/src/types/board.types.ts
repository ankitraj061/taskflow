
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: "ADMIN" | "WORKER";
  createdAt: string;
  user: User;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  taskId: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  listId: string;
  boardId?: string;
  createdAt: string;
  updatedAt: string;
  assignees: TaskAssignee[];
  labels: Label[];
}

export interface TaskList {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  description?: string | null;
  ownerId: string;
  owner: User;
  members: BoardMember[];
  lists: TaskList[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  metadata: JSON;
  boardId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export type BoardRole = "ADMIN" | "WORKER";