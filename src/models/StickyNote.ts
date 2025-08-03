import { StickyNote as TStickyNote } from "@/types/notes";
import { model, models, Schema } from "mongoose";

const StickyNoteSchema: Schema = new Schema(
  {
    title: { type: String },
    content: { type: String, required: true },
    textColor: { type: String, default: "#000000" },
    backgroundColor: { type: String, default: "#FeF08A" },
    order: {
      type: Number,
      default: 1,
    },
    isPinned: { type: Boolean, default: false },
    tag: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const StickyNote =
  models.StickyNote || model<TStickyNote>("StickyNote", StickyNoteSchema);
