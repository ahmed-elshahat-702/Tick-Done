"use client";

import { updateTaskList } from "@/actions/task-lists";
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

import { useTaskStore } from "@/lib/store";
import { TList } from "@/types/list";
import { TaskListFormData, taskListSchema } from "@/validation/List";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditListModelProps {
  isListModalOpen: boolean;
  editingList: TList | null;
  setIsListModalOpen: (open: boolean) => void;
  setEditingList: (list: TList | null) => void;
  taskIds: string[];
}

const EditListModel = ({
  isListModalOpen,
  editingList,
  setIsListModalOpen,
  setEditingList,
  taskIds,
}: EditListModelProps) => {
  const { lists, tasks, setLists } = useTaskStore();
  const [isHandling, setIsHandling] = useState(false);

  const myTasksList = lists.find((l) => l.name === "My Tasks");
  const myTasksListId = myTasksList?._id;

  const filteredTasks = tasks.filter(
    (task) => !task.listId || task.listId === myTasksList?._id
  );

  const form = useForm<TaskListFormData>({
    resolver: zodResolver(taskListSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#000000",
      taskIds: [],
    },
  });

  // Reset form when editingList changes
  useEffect(() => {
    if (editingList) {
      form.reset({
        name: editingList.name || "",
        description: editingList.description || "",
        color: editingList.color || "#000000",
        taskIds: taskIds || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#000000",
        taskIds: [],
      });
    }
  }, [editingList, taskIds, form]);

  const onListSubmit = async (data: TaskListFormData) => {
    if (!editingList) {
      toast.error("No list selected for editing.");
      return;
    }
    try {
      setIsHandling(true);

      // Get current tasks assigned to this list
      const currentTaskIds = tasks
        .filter((task) => task.listId === editingList._id)
        .map((task) => task._id);

      // Get new task IDs from form
      const newTaskIds = data.taskIds || [];

      // Update the list
      const res = await updateTaskList(editingList._id, {
        ...data,
        taskIds: newTaskIds,
      });

      if (res?.success && res?.taskList) {
        // Update list in store
        setLists(
          lists.map((c) => (c._id === editingList._id ? res.taskList : c))
        );

        // Get store actions
        const { updateTasksList } = useTaskStore.getState();

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
          updateTasksList(tasksToAdd, res.taskList._id);
        }
        if (tasksToRemove.length > 0 && myTasksListId) {
          updateTasksList(tasksToRemove, myTasksListId);
        }

        toast.success(res.success);
      } else {
        toast.error(res?.error || "Update failed");
      }

      form.reset();
      setIsListModalOpen(false);
      setEditingList(null);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <Dialog
      open={isListModalOpen}
      onOpenChange={(open) => {
        setIsListModalOpen(open);
        if (!open) {
          form.reset();
          setEditingList(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit List</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onListSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List Name *</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional description"
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
              name="taskIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Tasks</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={filteredTasks.map((task) => ({
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
                        aria-label="Select list color"
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
                  setIsListModalOpen(false);
                  setEditingList(null);
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

export default EditListModel;
