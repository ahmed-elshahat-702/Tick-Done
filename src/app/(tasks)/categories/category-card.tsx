"use client";

import { deleteTaskCategory } from "@/actions/task-categories";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { TCategory } from "@/types/category";
import { Edit, Trash, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryModal } from "./category-modal";
import {
  deleteAllCategoryTasks,
  deleteCompletedCategoryTasks,
} from "@/actions/tasks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CategoryCardProps {
  category: TCategory;
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const { categories, setCategories, tasks, setTasks, setSelectedCategoryId } =
    useAppStore();
  const [isHandling, setIsHandling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TCategory | null>(
    null
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<TCategory | null>(null);
  const [isDeleteCompletedDialogOpen, setIsDeleteCompletedDialogOpen] =
    useState<string | null>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState<
    string | null
  >(null);

  const handleEditCategory = (cat: TCategory) => {
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  const handleOpenDeleteDialog = (cat: TCategory) => {
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async (
    categoryId: string,
    deleteTasks: boolean
  ) => {
    try {
      setIsHandling(true);
      const res = await deleteTaskCategory(categoryId, deleteTasks);
      if (res?.success) {
        const getDescendantIds = (parentId: string): string[] => {
          const children = categories.filter((c) => c.parentId === parentId);
          return [
            parentId,
            ...children.flatMap((child) => getDescendantIds(child._id)),
          ];
        };
        const idsToRemove = getDescendantIds(categoryId);
        setCategories(categories.filter((c) => !idsToRemove.includes(c._id)));
        if (deleteTasks) {
          const taskIdsToRemove = tasks
            .filter((task) => idsToRemove.includes(task.categoryId || ""))
            .map((task) => task._id);
          setTasks(tasks.filter((task) => !taskIdsToRemove.includes(task._id)));
        }
        setSelectedCategoryId(categories[0]?._id || null);
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

  const handleDeleteCompletedTasks = async (categoryId: string) => {
    try {
      setIsHandling(true);
      const res = await deleteCompletedCategoryTasks(categoryId);

      if (res?.success) {
        const getDescendantIds = (parentId: string): string[] => {
          const children = categories.filter((c) => c.parentId === parentId);
          return [
            parentId,
            ...children.flatMap((child) => getDescendantIds(child._id)),
          ];
        };
        const categoryIds = getDescendantIds(categoryId);
        const updatedTasks = tasks.filter(
          (task) =>
            !categoryIds.includes(task.categoryId || "") ||
            task.status !== "done"
        );
        setTasks(updatedTasks);
        toast.success(res.success);
      } else {
        toast.error(res.error || "Failed to delete completed tasks.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setIsHandling(false);
      setIsDeleteCompletedDialogOpen(null);
    }
  };

  const handleDeleteAllTasks = async (categoryId: string) => {
    try {
      setIsHandling(true);
      const res = await deleteAllCategoryTasks(categoryId);

      if (res?.success) {
        const getDescendantIds = (parentId: string): string[] => {
          const children = categories.filter((c) => c.parentId === parentId);
          return [
            parentId,
            ...children.flatMap((child) => getDescendantIds(child._id)),
          ];
        };
        const categoryIds = getDescendantIds(categoryId);
        const updatedTasks = tasks.filter(
          (task) => !categoryIds.includes(task.categoryId || "")
        );
        setTasks(updatedTasks);
        toast.success(res.success);
      } else {
        toast.error(res.error || "Failed to delete all tasks.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setIsHandling(false);
      setIsDeleteAllDialogOpen(null);
    }
  };

  const subCategories = categories.filter((c) => c.parentId === category._id);
  const filteredTasks = tasks.filter(
    (task) => task.categoryId === category._id
  );

  const deleteCategoryTasks = categoryToDelete
    ? tasks.filter(
        (task) =>
          task.categoryId === categoryToDelete._id ||
          categories.some(
            (c) =>
              c.parentId === categoryToDelete._id && task.categoryId === c._id
          )
      )
    : [];
  const deleteSubCategories = categoryToDelete
    ? categories.filter((c) => c.parentId === categoryToDelete._id)
    : [];

  const completedTasks = filteredTasks.filter((task) => task.status === "done");

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: category.color || "#000000" }}
            />
            <h2 className="text-lg font-bold">{category.name}</h2>
          </div>
          {subCategories.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {subCategories.length} sub-categor
              {subCategories.length !== 1 ? "ies" : "y"}
            </p>
          )}
        </div>

        <div className="flex gap-2">
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
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Bulk Actions
        </span>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteCompletedDialogOpen(category._id)}
                  disabled={isHandling || completedTasks.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Completed
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete all completed tasks</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteAllDialogOpen(category._id)}
                  disabled={isHandling || filteredTasks.length === 0}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </TooltipTrigger>
              <TooltipContent>This will delete all tasks</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {subCategories.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-base font-semibold">
                Subcategories ({subCategories.length})
              </AccordionTrigger>
              <AccordionContent>
                {subCategories.map((subCategory) => {
                  const subTasks = tasks.filter(
                    (task) => task.categoryId === subCategory._id
                  );
                  const subCompletedTasks = subTasks.filter(
                    (task) => task.status === "done"
                  );

                  return (
                    <div
                      key={subCategory._id}
                      className="rounded-lg border p-4 bg-muted/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full border border-gray-300 dark:border-zinc-600"
                            style={{
                              backgroundColor: subCategory.color || "#000000",
                            }}
                          />
                          <span className="font-medium text-sm truncate max-w-[150px]">
                            {subCategory.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {subTasks.length} task
                            {subTasks.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditCategory(subCategory)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDeleteDialog(subCategory)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Sub Bulk Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setIsDeleteCompletedDialogOpen(subCategory._id)
                          }
                          disabled={
                            isHandling || subCompletedTasks.length === 0
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Completed
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setIsDeleteAllDialogOpen(subCategory._id)
                          }
                          disabled={isHandling || subTasks.length === 0}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete All
                        </Button>
                      </div>

                      {/* Sub Tasks */}
                      <div className="space-y-2">
                        {subTasks.length > 0 ? (
                          subTasks.map((task) => (
                            <TaskCard key={task._id} task={task} />
                          ))
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            No tasks in this sub-category.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Remaining tasks not in subcategories */}
        {filteredTasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">Tasks</h3>
            {filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}

        {subCategories.length === 0 && filteredTasks.length === 0 && (
          <p className="text-sm italic text-muted-foreground">
            No sub-categories or tasks in this category.
          </p>
        )}
      </div>

      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        category={categoryToEdit || category}
      />

      {categoryToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold text-destructive truncate max-w-[90%] flex items-center gap-2">
                Delete:
                <span className="truncate block max-w-40 md:max-w-60">
                  {categoryToDelete.name}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300 space-y-2 mt-1">
                <span className="block">
                  Are you sure you want to delete this category?
                </span>
                {deleteSubCategories.length > 0 && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
                    This will also delete{" "}
                    <strong>{deleteSubCategories.length}</strong> sub-categor
                    {deleteSubCategories.length !== 1 ? "ies" : "y"}:{" "}
                    <span className="w-full flex flex-col items-start max-sm:items-center max-sm:justify-center">
                      {deleteSubCategories.map((c, index) => (
                        <span
                          key={c._id}
                          className="italic truncate block text-center max-w-40 md:max-w-60"
                        >
                          {c.name}
                          {index !== deleteSubCategories.length - 1 && ","}
                        </span>
                      ))}
                    </span>
                    .
                  </span>
                )}
                {deleteCategoryTasks.length > 0 && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    This category and its sub-categories contain{" "}
                    <strong>{deleteCategoryTasks.length}</strong> task
                    {deleteCategoryTasks.length !== 1 ? "s" : ""}. Choose an
                    action:
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              {deleteCategoryTasks.length > 0 ? (
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
                    Keep Tasks (Unassign)
                  </Button>
                </>
              ) : (
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

      <Dialog
        open={!!isDeleteCompletedDialogOpen}
        onOpenChange={() => setIsDeleteCompletedDialogOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-destructive">
              Delete Completed Tasks
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete all completed tasks in this
              category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={() =>
                handleDeleteCompletedTasks(isDeleteCompletedDialogOpen!)
              }
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              {isHandling ? "Deleting..." : "Delete Completed Tasks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteCompletedDialogOpen(null)}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!isDeleteAllDialogOpen}
        onOpenChange={() => setIsDeleteAllDialogOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-destructive">
              Delete All Tasks
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete all tasks in this category? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={() => handleDeleteAllTasks(isDeleteAllDialogOpen!)}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              {isHandling ? "Deleting..." : "Delete All Tasks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllDialogOpen(null)}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryCard;
