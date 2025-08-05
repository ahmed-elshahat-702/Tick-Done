import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().optional(),
  content: z.any(),
});

export const stickyNoteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  tag: z.string().optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;
export type StickyNoteFormData = z.infer<typeof stickyNoteSchema>;
