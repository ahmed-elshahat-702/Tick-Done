import { TTask } from "@/types/task";
import { model, models, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const SubTaskSchema: Schema = new Schema({
  _id: { type: String, required: true, default: uuidv4() },
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["todo", "done"],
    default: "todo",
  },
});

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: false },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    dueDate: { type: Date, required: false },
    tag: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "TaskCategory",
    },
    listId: {
      type: Schema.Types.ObjectId,
      ref: "TaskList",
    },
    subTasks: [SubTaskSchema],
  },
  {
    timestamps: true,
  }
);

export const Task = models.Task || model<TTask>("Task", TaskSchema);
