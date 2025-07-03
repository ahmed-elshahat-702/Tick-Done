import { TTask } from "@/types/task";
import { model, models, Schema } from "mongoose";

const TaskSchema: Schema = new Schema<TTask>(
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
  },
  {
    timestamps: true,
  }
);

export const Task = models.Task || model<TTask>("Task", TaskSchema);
