"use client";

import { useState, useEffect } from "react";
import { createTaskList, updateTaskList } from "@/actions/task-lists";
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
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface ListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: TList | null;
}

export function ListModal({ open, onOpenChange, list }: ListModalProps) {
  const { addList, setLists, tasks, lists, updateTasksList } = useTaskStore();
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

  useEffect(() => {
    if (list) {
      form.reset({
        name: list.name || "",
        description: list.description || "",
        color: list.color || "#000000",
        taskIds:
          tasks
            .filter((task) => task.listId === list._id)
            .map((task) => task._id) || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#000000",
        taskIds: [],
      });
    }
  }, [list, form, tasks]);

  const onSubmit = async (data: TaskListFormData) => {
    try {
      setIsHandling(true);
      if (list) {
        const currentTaskIds = tasks
          .filter((task) => task.listId === list._id)
          .map((task) => task._id);
        const newTaskIds = data.taskIds || [];
        const res = await updateTaskList(list._id, {
          ...data,
          taskIds: newTaskIds,
        });
        if (res?.success && res?.taskList) {
          setLists(lists.map((c) => (c._id === list._id ? res.taskList : c)));
          const tasksToAdd = newTaskIds.filter(
            (id) => !currentTaskIds.includes(id)
          );
          const tasksToRemove = currentTaskIds.filter(
            (id) => !newTaskIds.includes(id)
          );
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
      } else {
        const res = await createTaskList(data);
        if (res?.success && res?.taskList) {
          addList(res.taskList);
          if (data.taskIds) {
            updateTasksList(data.taskIds, res.taskList._id);
          }
          toast.success(res.success);
        } else {
          toast.error(res?.error || "Failed to create list");
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
        name: list?.name || "",
        description: list?.description || "",
        color: list?.color || "#000000",
        taskIds: list
          ? tasks
              .filter((task) => task.listId === list._id)
              .map((task) => task._id) || []
          : [],
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{list ? "Edit List" : "New Task List"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                onClick={handleClose}
                disabled={isHandling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isHandling}>
                {isHandling ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    {list ? "Updating..." : "Adding..."}
                  </>
                ) : list ? (
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
