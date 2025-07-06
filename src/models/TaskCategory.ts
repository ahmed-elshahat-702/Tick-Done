import mongoose, { Schema } from "mongoose";

const taskCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: String, default: null },
    color: { type: String, default: "#000000" },
  },
  { timestamps: true }
);

export const TaskCategory =
  mongoose.models.TaskCategory ||
  mongoose.model("TaskCategory", taskCategorySchema);
