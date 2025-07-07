"use client";

import { updateTaskCategory } from "@/actions/task-categories";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskStore } from "@/lib/store";
import { TCategory } from "@/types/category";
import { CategoryFormData, categorySchema } from "@/validation/Category";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditCategoryModelProps {
  isCategoryModalOpen: boolean;
  editingCategory: TCategory | null;
  setIsCategoryModalOpen: (open: boolean) => void;
  setEditingCategory: (category: TCategory | null) => void;
  taskIds: string[];
}

const EditCategoryModel = ({
  isCategoryModalOpen,
  editingCategory,
  setIsCategoryModalOpen,
  setEditingCategory,
  taskIds,
}: EditCategoryModelProps) => {
  const { categories, tasks, setCategories } = useTaskStore();
  const [isHandling, setIsHandling] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      parentId: null,
      color: "#000000",
      taskIds: [],
    },
  });

  // Reset form when editingCategory changes
  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name || "",
        parentId: editingCategory.parentId || null,
        color: editingCategory.color || "#000000",
        taskIds: taskIds || [],
      });
    } else {
      form.reset({
        name: "",
        parentId: null,
        color: "#000000",
        taskIds: [],
      });
    }
  }, [editingCategory, taskIds, form]);

  const onCategorySubmit = async (data: CategoryFormData) => {
    if (!editingCategory) {
      toast.error("No category selected for editing.");
      return;
    }
    try {
      setIsHandling(true);

      // Get current tasks assigned to this category
      const currentTaskIds = tasks
        .filter((task) => task.categoryId === editingCategory._id)
        .map((task) => task._id);

      // Get new task IDs from form
      const newTaskIds = data.taskIds || [];

      // Update the category
      const res = await updateTaskCategory(editingCategory._id, {
        ...data,
        taskIds: newTaskIds,
      });

      if (res?.success && res?.category) {
        // Update category in store
        setCategories(
          categories.map((c) =>
            c._id === editingCategory._id ? res.category : c
          )
        );

        // Get store actions
        const { updateTasksCategory, removeTasksCategory } =
          useTaskStore.getState();

        // Find tasks that were added
        const tasksToAdd = newTaskIds.filter(
          (id) => !currentTaskIds.includes(id)
        );
        // Find tasks that were removed
        const tasksToRemove = currentTaskIds.filter(
          (id) => !newTaskIds.includes(id)
        );

        // Update tasks in store
        if (tasksToAdd.length > 0) {
          updateTasksCategory(tasksToAdd, res.category._id);
        }
        if (tasksToRemove.length > 0) {
          removeTasksCategory(tasksToRemove);
        }

        toast.success(res.success);
      } else {
        toast.error(res?.error || "Update failed");
      }

      setIsCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <Dialog
      open={isCategoryModalOpen}
      onOpenChange={(open) => {
        setIsCategoryModalOpen(open);
        if (!open) {
          form.reset();
          setEditingCategory(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Category
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onCategorySubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a name"
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : val)
                    }
                    value={field.value ?? "none"}
                    disabled={isHandling}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full line-clamp-1 truncate">
                        <SelectValue placeholder="Select parent category..." />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[--radix-select-content-available-height]">
                      <SelectItem value="none" className="text-sm">
                        <span className="truncate">
                          None (Top-level category)
                        </span>
                      </SelectItem>

                      {categories
                        .filter(
                          (c) =>
                            (!editingCategory ||
                              c._id !== editingCategory._id) &&
                            (!c.parentId || c.parentId === null)
                        )
                        .map((cat) => (
                          <SelectItem
                            key={cat._id}
                            value={cat._id}
                            className="text-sm"
                          >
                            <span className="truncate max-w-64 sm:max-w-90">
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taskIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Tasks</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={tasks
                        .filter(
                          (task) =>
                            !task.categoryId || // Tasks with no category
                            (editingCategory &&
                              task.categoryId === editingCategory._id) // Tasks assigned to the current editing category
                        )
                        .map((task) => ({
                          value: task._id,
                          label: task.title,
                        }))}
                      selected={
                        field.value?.map((id) => ({
                          value: id,
                          label:
                            tasks.find((task) => task._id === id)?.title || id,
                        })) || []
                      }
                      onChange={(selected) =>
                        field.onChange(selected.map((option) => option.value))
                      }
                      placeholder="Select tasks..."
                      disabled={isHandling}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="h-9 w-12 p-0 border-none"
                        {...field}
                        aria-label="Select category color"
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
                disabled={isHandling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isHandling}>
                {isHandling ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModel;
