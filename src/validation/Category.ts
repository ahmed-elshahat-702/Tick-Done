import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  parentId: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
    .optional(),
  taskIds: z.array(z.string()).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
