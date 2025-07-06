"use client";

import { deleteTaskCategory } from "@/actions/task-categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskStore } from "@/lib/store";
import { TCategory } from "@/types/category";
import { CategoryFormData } from "@/validation/Category";
import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { ObjectId } from "mongoose";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CategoryCardProps {
  category: TCategory & { taskCount?: number };
  setEditingCategory: (category: TCategory) => void;
  setIsCategoryModalOpen: (open: boolean) => void;
  form: ReturnType<typeof useForm<CategoryFormData>>;
}

const CategoryCard = ({
  category,
  setEditingCategory,
  setIsCategoryModalOpen,
  form,
}: CategoryCardProps) => {
  const { categories, setCategories, tasks, setTasks } = useTaskStore();
  const [isHandling, setIsHandling] = useState(false);
  const [isSubCategoriesOpen, setIsSubCategoriesOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TCategory | null>(
    null
  );

  const handleEditCategory = (cat: TCategory) => {
    setEditingCategory(cat);
    form.reset({
      name: cat.name,
      parentId: cat.parentId ?? null,
      color: cat.color || "#000000",
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenDeleteDialog = (cat: TCategory) => {
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async (
    categoryId: ObjectId,
    deleteTasks: boolean
  ) => {
    try {
      setIsHandling(true);
      const res = await deleteTaskCategory(categoryId, deleteTasks);
      if (res?.success) {
        // Get all descendant category IDs
        const getDescendantIds = (parentId: string): string[] => {
          const children = categories.filter(
            (c) => c.parentId?.toString() === parentId
          );
          return [
            parentId,
            ...children.flatMap((child) =>
              getDescendantIds(child._id.toString())
            ),
          ];
        };
        const idsToRemove = getDescendantIds(categoryId.toString());
        // Update state to remove the category and all its descendants
        setCategories(
          categories.filter((c) => !idsToRemove.includes(c._id.toString()))
        );
        // Remove associated tasks if deleteTasks is true
        if (deleteTasks) {
          const taskIdsToRemove = tasks
            .filter((task) =>
              idsToRemove.includes(task.categoryId?.toString() || "")
            )
            .map((task) => task._id?.toString());
          setTasks(
            tasks.filter(
              (task) => !taskIdsToRemove.includes(task._id?.toString())
            )
          );
        }
        toast.success(res.success);
      } else {
        toast.error(res.error || "Failed to delete category.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setIsHandling(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const parentName = category.parentId
    ? categories.find((c) => c._id?.toString() === category.parentId)?.name ||
      "Unknown"
    : null;

  // Find sub-categories where parentId matches the current category's _id
  const subCategories = categories.filter(
    (c) => c.parentId?.toString() === category._id?.toString()
  );

  // Filter tasks for the current category and its sub-categories
  const filteredTasks = tasks.filter(
    (task) =>
      task.categoryId?.toString() === category._id?.toString() ||
      subCategories.some(
        (subCategory) =>
          task.categoryId?.toString() === subCategory._id?.toString()
      )
  );

  // Get tasks and sub-categories for the category being deleted
  const deleteCategoryTasks = categoryToDelete
    ? tasks.filter(
        (task) =>
          task.categoryId?.toString() === categoryToDelete._id?.toString() ||
          categories.some(
            (c) =>
              c.parentId?.toString() === categoryToDelete._id?.toString() &&
              task.categoryId?.toString() === c._id?.toString()
          )
      )
    : [];
  const deleteSubCategories = categoryToDelete
    ? categories.filter(
        (c) => c.parentId?.toString() === categoryToDelete._id?.toString()
      )
    : [];
  return (
    <div className="relative bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl p-5 shadow-md hover:shadow-xl transition-shadow duration-300 w-full">
      {/* Actions (Top Right) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEditCategory(category)}
          disabled={isHandling}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
          aria-label={`Edit category ${category.name}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenDeleteDialog(category)}
          disabled={isHandling}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"
          aria-label={`Delete category ${category.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-10 w-10 rounded-full border-2 border-gray-200 dark:border-zinc-600 flex-shrink-0"
          style={{ backgroundColor: category.color || "#000000" }}
          aria-label={`Category color for ${category.name}`}
        />
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {category.name}
          </h3>
          {parentName && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 italic">
              Parent: {parentName}
            </span>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300 mb-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-2">
        <span>
          <strong>{filteredTasks.length}</strong> task
          {filteredTasks.length !== 1 ? "s" : ""}
        </span>
        <span>
          <strong>{subCategories.length}</strong> sub-categor
          {subCategories.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      {/* Sub-Categories Section */}
      {subCategories.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsSubCategoriesOpen(!isSubCategoriesOpen)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white w-full py-2 transition-colors duration-200"
            aria-expanded={isSubCategoriesOpen}
            aria-controls="sub-categories"
          >
            {isSubCategoriesOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Sub-Categories
          </button>
          {isSubCategoriesOpen && (
            <ul
              id="sub-categories"
              className="mt-2 space-y-2 pl-4 transition-all duration-300 ease-in-out"
            >
              {subCategories.map((subCategory) => (
                <li
                  key={subCategory._id?.toString()}
                  className="flex items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-md p-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full border border-gray-300 dark:border-zinc-600"
                      style={{
                        backgroundColor: subCategory.color || "#000000",
                      }}
                      aria-label={`Sub-category color for ${subCategory.name}`}
                    />
                    <span className="truncate">{subCategory.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      (
                      {
                        tasks.filter(
                          (task) =>
                            task.categoryId?.toString() ===
                            subCategory._id?.toString()
                        ).length
                      }{" "}
                      tasks)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditCategory(subCategory)}
                      disabled={isHandling}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDeleteDialog(subCategory)}
                      disabled={isHandling}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tasks Section */}
      {filteredTasks.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsTasksOpen(!isTasksOpen)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white w-full py-2 transition-colors duration-200"
            aria-expanded={isTasksOpen}
            aria-controls="tasks"
          >
            {isTasksOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Tasks
          </button>
          {isTasksOpen && (
            <ul
              id="tasks"
              className="mt-2 space-y-2 pl-4 transition-all duration-300 ease-in-out"
            >
              {filteredTasks.map((task) => (
                <li
                  key={task._id?.toString()}
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-md p-2"
                >
                  <span className="font-medium truncate">{task.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      task.status === "done"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {categoryToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {categoryToDelete.name}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the category &quot;
                {categoryToDelete.name}&quot;?
                {deleteSubCategories.length > 0 && (
                  <span className="mt-2">
                    This will also delete {deleteSubCategories.length}{" "}
                    sub-categor
                    {deleteSubCategories.length !== 1 ? "ies" : "y"}: [
                    {deleteSubCategories.map((c) => c.name).join(", ")}].
                  </span>
                )}
                {deleteCategoryTasks.length > 0 && (
                  <span className="mt-2">
                    This category and its sub-categories contain{" "}
                    {deleteCategoryTasks.length} task
                    {deleteCategoryTasks.length !== 1 ? "s" : ""}. Choose an
                    action for these tasks:
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {deleteCategoryTasks.length > 0 && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleDeleteCategory(categoryToDelete._id, true)
                    }
                    disabled={isHandling}
                    className="w-full sm:w-auto"
                  >
                    Delete Tasks
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDeleteCategory(categoryToDelete._id, false)
                    }
                    disabled={isHandling}
                    className="w-full sm:w-auto"
                  >
                    Keep Tasks (Unassign Category)
                  </Button>
                </>
              )}
              {deleteCategoryTasks.length === 0 && (
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeleteCategory(categoryToDelete._id, false)
                  }
                  disabled={isHandling}
                  className="w-full sm:w-auto"
                >
                  Delete Category
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isHandling}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CategoryCard;
