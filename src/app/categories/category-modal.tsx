"use client";

import { useState, useEffect } from "react";
import {
  createTaskCategory,
  updateTaskCategory,
} from "@/actions/task-categories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTaskStore } from "@/lib/store";
import { TCategory } from "@/types/category";
import { CategoryFormData, categorySchema } from "@/validation/Category";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: TCategory | null;
}

export function CategoryModal({
  open,
  onOpenChange,
  category,
}: CategoryModalProps) {
  const {
    addCategory,
    setCategories,
    tasks,
    categories,
    updateTasksCategory,
    removeTasksCategory,
  } = useTaskStore();
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

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || "",
        parentId: category.parentId || null,
        color: category.color || "#000000",
        taskIds:
          tasks
            .filter((task) => task.categoryId === category._id)
            .map((task) => task._id) || [],
      });
    } else {
      form.reset({
        name: "",
        parentId: null,
        color: "#000000",
        taskIds: [],
      });
    }
  }, [category, form, tasks]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsHandling(true);
      if (category) {
        const currentTaskIds = tasks
          .filter((task) => task.categoryId === category._id)
          .map((task) => task._id);
        const newTaskIds = data.taskIds || [];
        const res = await updateTaskCategory(category._id, {
          ...data,
          taskIds: newTaskIds,
        });
        if (res?.success && res?.category) {
          setCategories(
            categories.map((c) => (c._id === category._id ? res.category : c))
          );
          const tasksToAdd = newTaskIds.filter(
            (id) => !currentTaskIds.includes(id)
          );
          const tasksToRemove = currentTaskIds.filter(
            (id) => !newTaskIds.includes(id)
          );
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
      } else {
        const res = await createTaskCategory(data);
        if (res?.success && res?.category) {
          addCategory(res.category);
          if (data.taskIds) {
            updateTasksCategory(data.taskIds, res.category._id);
          }
          toast.success(res.success);
        } else {
          toast.error(res?.error || "Failed to create category");
        }
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  const handleClose = () => {
    if (!isHandling) {
      form.reset({
        name: category?.name || "",
        parentId: category?.parentId || null,
        color: category?.color || "#000000",
        taskIds: category
          ? tasks
              .filter((task) => task.categoryId === category._id)
              .map((task) => task._id) || []
          : [],
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)]  overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "New Category"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            (!category || c._id !== category._id) &&
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
                            !task.categoryId ||
                            (category && task.categoryId === category._id)
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
                onClick={handleClose}
                disabled={isHandling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isHandling}>
                {isHandling ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    {category ? "Updating..." : "Adding..."}
                  </>
                ) : category ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
