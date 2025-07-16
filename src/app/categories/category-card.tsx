"use client";

import { deleteTaskCategory } from "@/actions/task-categories";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryModal } from "./category-modal";

interface CategoryCardProps {
  category: TCategory;
  setSelectedCategoryId: (id: string | null) => void;
}

const CategoryCard = ({
  category,
  setSelectedCategoryId,
}: CategoryCardProps) => {
  const { categories, setCategories, tasks, setTasks } = useTaskStore();
  const [isHandling, setIsHandling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TCategory | null>(
    null
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleEditCategory = () => {
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
        setSelectedCategoryId(categories[0]._id || null);
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

  return (
    <div className="space-y-4 bg-muted/50 dark:bg-muted/100 min-h-96 rounded-md p-4 md:p-6">
      <div className="relative w-full space-y-1 p-2">
        <div className="flex items-center gap-3">
          <div
            className="h-6 w-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || "#000000" }}
            aria-label={`Category color for ${category.name}`}
          />
          <h1 className="font-bold">{category.name}</h1>
        </div>
        {subCategories.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {subCategories.length} sub-categor
            {subCategories.length !== 1 ? "ies" : "y"}
          </p>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditCategory()}
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

      <div className="space-y-2">
        {subCategories.length > 0 || filteredTasks.length > 0 ? (
          <>
            {subCategories.map((subCategory) => {
              const subTasks = tasks.filter(
                (task) => task.categoryId === subCategory._id
              );

              return (
                <Collapsible key={subCategory._id}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between w-full p-2 px-3 bg-muted/70 hover:bg-muted rounded-lg transition-all">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-gray-300 dark:border-zinc-600"
                          style={{
                            backgroundColor: subCategory.color || "#000000",
                          }}
                        />
                        <span className="font-medium text-sm truncate max-w-[120px]">
                          {subCategory.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {subTasks.length} task
                          {subTasks.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory();
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteDialog(subCategory);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <ChevronDown className="h-4 w-4 transition-transform duration-300 data-[state=open]:rotate-180" />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pl-6 pt-2 space-y-2 border-l border-muted-foreground/10 ml-2">
                    {subTasks.length > 0 ? (
                      subTasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        No tasks in this sub-category.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            No sub-categories or tasks in this category.
          </p>
        )}
      </div>

      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        category={category}
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
    </div>
  );
};

export default CategoryCard;
