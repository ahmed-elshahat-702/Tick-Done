import { TList } from "@/types/list";
import mongoose, { Schema } from "mongoose";

const taskListSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    color: { type: String, default: "#000000" },
  },
  { timestamps: true }
);

export const TaskList =
  mongoose.models.TaskList || mongoose.model<TList>("TaskList", taskListSchema);
