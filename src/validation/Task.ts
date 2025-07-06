import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  tag: z.string().optional(),
  subTasks: z
    .array(
      z.object({
        _id: z.string(),
        title: z.string().min(1, "Sub-task title is required"),
        status: z.enum(["todo", "done"]),
      })
    )
    .optional(),
  categoryId: z.string().nullable().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
