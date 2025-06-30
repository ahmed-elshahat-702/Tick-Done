import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional(),
  tag: z.string().max(20, "Tag must be less than 20 characters").optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
