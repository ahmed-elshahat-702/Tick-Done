import { Note as TNote } from "@/types/notes";
import { model, models, Schema } from "mongoose";

const NoteSchema: Schema = new Schema(
  {
    title: { type: String },
    content: { type: Schema.Types.Mixed, required: true },
    order: {
      type: Number,
      default: 1,
    },
    isPinned: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Note = models.Note || model<TNote>("Note", NoteSchema);
