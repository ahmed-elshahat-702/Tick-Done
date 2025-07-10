export interface TTask {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId?: string;
  listId?: string;
  subTasks?: SubTask[];
}

export interface SubTask {
  _id: string;
  title: string;
  status: "todo" | "done";
}
