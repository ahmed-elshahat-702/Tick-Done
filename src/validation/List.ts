import { z } from "zod";

export const taskListSchema = z.object({
  name: z.string().min(1, "List name is required").trim(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
  taskIds: z.array(z.string()).optional(),
});

export type TaskListFormData = z.infer<typeof taskListSchema>;
