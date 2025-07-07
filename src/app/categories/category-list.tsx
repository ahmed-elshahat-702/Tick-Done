"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select"; // Import the MultiSelect component
import { useTaskStore } from "@/lib/store";
import {
  createTaskCategory,
  getTaskCategories,
  updateTaskCategory,
} from "@/actions/task-categories";
import { TCategory } from "@/types/category";
import { CategoryFormData, categorySchema } from "@/validation/Category";
import CategoryCard from "@/app/categories/category-card";

const CategoryList = () => {
  const { categories, tasks, setCategories, addCategory } = useTaskStore();
  const [isHandling, setIsHandling] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TCategory | null>(
    null
  );

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
    async function fetchCategories() {
      const res = await getTaskCategories();
      if (res.categories) {
        setCategories(res.categories);
      } else {
        toast.error(res.error || "Failed to fetch categories");
      }
    }
    fetchCategories();
  }, [setCategories]);

  const onCategorySubmit = async (data: CategoryFormData) => {
    try {
      setIsHandling(true);

      if (editingCategory) {
        const res = await updateTaskCategory(editingCategory._id, data);
        if (res?.success && res?.category) {
          setCategories(
            categories.map((c) =>
              c._id === editingCategory._id ? res.category : c
            )
          );
          if (data.taskIds) {
            useTaskStore
              .getState()
              .updateTasksCategory(data.taskIds, res.category._id);
          }
          toast.success(res.success);
        } else {
          toast.error(res.error || "Update failed");
        }
      } else {
        const res = await createTaskCategory(data);
        if (res?.success && res?.category) {
          addCategory(res.category);
          if (data.taskIds) {
            useTaskStore
              .getState()
              .updateTasksCategory(data.taskIds, res.category._id);
          }
          toast.success(res.success);
        } else {
          toast.error(res.error || "Create failed");
        }
      }

      form.reset({ name: "", parentId: null, color: "#000000", taskIds: [] });
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Task Categories
        </h2>
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
          <DialogTrigger asChild>
            <Button>
              {editingCategory ? "Edit Category" : "Add Category"}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingCategory ? "Edit Category" : "New Category"}
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
                          <SelectTrigger>
                            <SelectValue placeholder="Choose parent..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories
                            .filter(
                              (c) =>
                                (!editingCategory ||
                                  c._id !== editingCategory._id) &&
                                (!c.parentId || c.parentId === null)
                            )
                            .map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
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
                                tasks.find((task) => task._id === id)?.title ||
                                id,
                            })) || []
                          }
                          onChange={(selected) =>
                            field.onChange(
                              selected.map((option) => option.value)
                            )
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
                      form.reset({
                        name: "",
                        parentId: null,
                        color: "#000000",
                        taskIds: [],
                      });
                      setEditingCategory(null);
                      setIsCategoryModalOpen(false);
                    }}
                    disabled={isHandling}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isHandling}>
                    {isHandling ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        {editingCategory ? "Updating..." : "Adding..."}
                      </>
                    ) : editingCategory ? (
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
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No categories yet. Start by adding one.
          </p>
        ) : (
          <div className="grid gap-3 grid-cols-1">
            {categories
              .filter((category) => !category.parentId)
              .map((category) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  setEditingCategory={setEditingCategory}
                  setIsCategoryModalOpen={setIsCategoryModalOpen}
                  form={form}
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryList;
