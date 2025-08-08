import { deleteTaskList } from "@/actions/task-lists";
import { deleteAllListTasks, deleteCompletedListTasks } from "@/actions/tasks";
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
import { TList } from "@/types/list";
import { TTask } from "@/types/task";
import { Edit, Trash, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListModal } from "./list-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type Props = {
  list: TList;
  tasks: TTask[];
};

const TaskListCard = ({ list, tasks }: Props) => {
  const { setTasks, lists, setLists, setSelectedListId } = useAppStore();
  const [isHandling, setIsHandling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<TList | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<TList | null>(null);
  const [isDeleteCompletedDialogOpen, setIsDeleteCompletedDialogOpen] =
    useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  const isMyTasksList = list.name === "My Tasks";
  const listTasks = isMyTasksList
    ? tasks.filter((task) => !task.listId || task.listId === list._id)
    : tasks.filter((task) => task.listId === list._id);

  const allTasksList = lists.find((l) => l.name === "My Tasks");

  const handleEditList = (list: TList) => {
    setEditingList(list);
    setIsListModalOpen(true);
  };

  const handleOpenDeleteDialog = (cat: TList) => {
    setListToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteList = async (listId: string, deleteTasks: boolean) => {
    try {
      setIsHandling(true);
      const res = await deleteTaskList(listId, deleteTasks);

      if (res?.success) {
        if (deleteTasks) {
          const taskIdsToRemove = tasks
            .filter((task) => task.listId === listId)
            .map((task) => task._id);
          setTasks(tasks.filter((task) => !taskIdsToRemove.includes(task._id)));
        } else {
          if (allTasksList) {
            const updatedTasks = tasks.map((task) =>
              task.listId === listId
                ? { ...task, listId: allTasksList._id }
                : task
            );
            setTasks(updatedTasks);
          }
        }

        setLists(lists.filter((l) => l._id !== listId));
        setSelectedListId(allTasksList?._id || null);
        toast.success(res.success);
      } else {
        toast.error(res.error || "Failed to delete list.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.error(error);
    } finally {
      setIsHandling(false);
      setIsDeleteDialogOpen(false);
      setListToDelete(null);
    }
  };

  const handleDeleteCompletedTasks = async () => {
    try {
      setIsHandling(true);
      const res = await deleteCompletedListTasks(list._id);

      if (res?.success) {
        const updatedTasks = tasks.filter(
          (task) => !(task.listId === list._id && task.status === "done")
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
      setIsDeleteCompletedDialogOpen(false);
    }
  };

  const handleDeleteAllTasks = async () => {
    try {
      setIsHandling(true);
      const res = await deleteAllListTasks(list._id);

      if (res?.success) {
        const updatedTasks = tasks.filter((task) => task.listId !== list._id);
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
      setIsDeleteAllDialogOpen(false);
    }
  };

  const deleteListTasks = listToDelete
    ? tasks.filter((task) => task.listId === listToDelete._id)
    : [];

  const completedTasks = listTasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="relative w-full space-y-1 p-2">
        <h1 className="font-bold">{list.name}</h1>

        {list.description && (
          <p className="text-sm text-muted-foreground">{list.description}</p>
        )}

        {!isMyTasksList && (
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditList(list)}
              disabled={isHandling}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-full"
              aria-label={`Edit list ${list.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDeleteDialog(list)}
              disabled={isHandling}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full"
              aria-label={`Delete list ${list.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <TooltipProvider>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="text-sm font-medium text-muted-foreground">
            Bulk Actions
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteCompletedDialogOpen(true)}
                  disabled={isHandling || completedTasks.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Completed
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Delete all completed tasks</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteAllDialogOpen(true)}
                  disabled={isHandling || listTasks.length === 0}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>This will delete all tasks</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      <div className="space-y-2">
        {listTasks.length > 0 ? (
          listTasks.map((task) => <TaskCard key={task._id} task={task} />)
        ) : (
          <p className="text-xs italic text-muted-foreground">
            No tasks in this list.
          </p>
        )}
      </div>

      <ListModal
        open={isListModalOpen}
        onOpenChange={setIsListModalOpen}
        list={editingList}
      />

      {listToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold text-destructive truncate max-w-[90%] flex items-center gap-2">
                Delete:
                <span className="truncate block max-w-40 md:max-w-60">
                  {listToDelete.name}
                </span>
              </DialogTitle>

              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300 space-y-2 mt-1">
                <span className="block">
                  Are you sure you want to delete this list?
                </span>

                {deleteListTasks.length > 0 && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    This list contains <strong>{deleteListTasks.length}</strong>{" "}
                    task{deleteListTasks.length !== 1 ? "s" : ""}. Choose an
                    action:
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              {deleteListTasks.length > 0 ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteList(listToDelete._id, true)}
                    disabled={isHandling}
                    className="w-full sm:w-auto"
                  >
                    Delete Tasks
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleDeleteList(listToDelete._id, false)}
                    disabled={isHandling}
                    className="w-full sm:w-auto"
                  >
                    Keep Tasks (Move to &quot;My Tasks&quot;)
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteList(listToDelete._id, false)}
                  disabled={isHandling}
                  className="w-full sm:w-auto"
                >
                  {isHandling ? "Deleting..." : "Delete List"}
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
        open={isDeleteCompletedDialogOpen}
        onOpenChange={setIsDeleteCompletedDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-destructive">
              Delete Completed Tasks
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete all completed tasks in this list?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteCompletedTasks}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              {isHandling ? "Deleting..." : "Delete Completed Tasks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteCompletedDialogOpen(false)}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteAllDialogOpen}
        onOpenChange={setIsDeleteAllDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold text-destructive">
              Delete All Tasks
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete all tasks in this list? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteAllTasks}
              disabled={isHandling}
              className="w-full sm:w-auto"
            >
              {isHandling ? "Deleting..." : "Delete All Tasks"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllDialogOpen(false)}
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

export default TaskListCard;
