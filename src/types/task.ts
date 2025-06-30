import { ObjectId } from "mongoose";

export interface TTask {
  _id: ObjectId;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: ObjectId;
}
