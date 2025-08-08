"use client";

import { useState, useEffect } from "react";
import { createTask, UpdateTask } from "@/actions/tasks";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TTask, SubTask } from "@/types/task";
import { TaskFormData, taskSchema } from "@/validation/Task";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TTask | null;
  selectedListId?: string | null;
  selectedCategoryId?: string | null;
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  selectedListId,
  selectedCategoryId,
}: TaskModalProps) {
  const { addTask, editTask, isHandling, setIsHandling, categories, lists } =
    useAppStore();
  const [subTasks, setSubTasks] = useState<SubTask[]>(task?.subTasks || []);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const myTasksList = lists.find((l) => l.name === "My Tasks");
  const myTasksListId = myTasksList?._id;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: undefined,
      tag: "",
      subTasks: [],
      categoryId: selectedCategoryId || null,
      listId: selectedListId || myTasksListId || "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        priority: task.priority || "medium",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        tag: task.tag || "",
        subTasks: task.subTasks || [],
        categoryId: task.categoryId ?? null,
        listId: task.listId || myTasksListId || "",
      });
      setSubTasks(task.subTasks || []);
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        dueDate: undefined,
        tag: "",
        subTasks: [],
        categoryId: selectedCategoryId || null,
        listId: selectedListId || myTasksListId || "",
      });
      setSubTasks([]);
    }
  }, [task, form, myTasksListId, selectedListId, selectedCategoryId]);

  const addSubTask = () => {
    if (!newSubTaskTitle.trim()) {
      toast.error("Sub-task title cannot be empty.");
      return;
    }
    if (
      subTasks.some(
        (subTask) =>
          subTask.title.toLowerCase() === newSubTaskTitle.trim().toLowerCase()
      )
    ) {
      toast.error("A sub-task with this title already exists.");
      return;
    }
    const newSubTask: SubTask = {
      _id: uuidv4(),
      title: newSubTaskTitle.trim(),
      status: "todo",
    };
    setSubTasks([...subTasks, newSubTask]);
    setNewSubTaskTitle("");
    form.setValue("subTasks", [...subTasks, newSubTask]);
  };

  const removeSubTask = (id: string) => {
    const updatedSubTasks = subTasks.filter((subTask) => subTask._id !== id);
    setSubTasks(updatedSubTasks);
    form.setValue("subTasks", updatedSubTasks);
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      setIsHandling(true);
      const taskData = { ...data, subTasks: data.subTasks || [] };
      let res;
      if (task) {
        res = await UpdateTask(task._id, taskData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        if (res?.success && res?.task) {
          await editTask(task._id, res.task);
          toast.success(res.success);
        }
      } else {
        res = await createTask(taskData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        if (res?.success && res?.task) {
          addTask(res.task);
          toast.success(res.success);
        }
        form.reset({
          title: "",
          description: "",
          priority: "medium",
          dueDate: undefined,
          tag: "",
          subTasks: [],
          categoryId: selectedCategoryId || null,
          listId: selectedListId || myTasksListId || "",
        });
      }
      setSubTasks([]);
      setNewSubTaskTitle("");
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
        title: task?.title || "",
        description: task?.description || "",
        priority: task?.priority || "medium",
        dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
        tag: task?.tag || "",
        subTasks: task?.subTasks || [],
        categoryId: task?.categoryId || selectedCategoryId || null,
        listId: task?.listId || selectedListId || myTasksListId || "",
      });
      setSubTasks(task?.subTasks || []);
      setNewSubTaskTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title..."
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
                    <Textarea
                      placeholder="Enter task description..."
                      className="resize-none"
                      rows={3}
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Sub-tasks</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="Add sub-task..."
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    disabled={isHandling}
                  />
                </FormControl>
                <Button
                  type="button"
                  size="icon"
                  onClick={addSubTask}
                  disabled={isHandling || !newSubTaskTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {subTasks.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {subTasks.map((subTask) => (
                    <Badge
                      variant="secondary"
                      key={subTask._id}
                      className="break-words whitespace-normal group flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs transition hover:bg-muted/80"
                    >
                      <span className="text-sm text-foreground break-all">
                        {subTask.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10 ml-1"
                        onClick={() => removeSubTask(subTask._id)}
                        disabled={isHandling}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isHandling}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isHandling}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      defaultValue={field.value || "none"}
                      disabled={isHandling}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            <span className="truncate max-w-64 sm:max-w-90">
                              {category.name}
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
                name="listId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>List</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      defaultValue={field.value}
                      disabled={isHandling}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select list" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {myTasksListId && (
                          <SelectItem value={myTasksListId}>
                            My Tasks
                          </SelectItem>
                        )}
                        {lists
                          .filter((list) => list.name !== "My Tasks")
                          .map((list) => (
                            <SelectItem
                              key={list._id}
                              value={list._id}
                              className="text-sm"
                            >
                              <span className="truncate max-w-64 sm:max-w-90">
                                {list.name}
                              </span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tag (optional)..."
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isHandling}
                className="w-full sm:w-auto bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isHandling}
                className="w-full sm:w-auto"
              >
                {isHandling ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    {task ? "Updating..." : "Adding..."}
                  </>
                ) : task ? (
                  "Update Task"
                ) : (
                  "Add Task"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
