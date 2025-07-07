"use client";

import { useState, useEffect } from "react";
import { createTask } from "@/actions/tasks";
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
import { useTaskStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SubTask } from "@/types/task";
import { TaskFormData, taskSchema } from "@/validation/Task";
import { CategoryFormData, categorySchema } from "@/validation/Category";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "./ui/badge";
import { MultiSelect } from "./ui/multi-select";
import { createTaskCategory } from "@/actions/task-categories";

interface AddBothProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModal?: "task" | "category" | "choice";
}

export function AddBoth({ open, onOpenChange, initialModal }: AddBothProps) {
  const { addTask, isHandling, setIsHandling, categories, addCategory, tasks } =
    useTaskStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(
    initialModal === "task"
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(
    initialModal === "category"
  );
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(
    initialModal === "choice" || !initialModal
  );
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: undefined,
      tag: "",
      subTasks: [],
      categoryId: null,
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      parentId: null,
      color: "#000000",
      taskIds: [],
    },
  });

  useEffect(() => {
    if (initialModal === "task") {
      setIsTaskModalOpen(true);
      setIsCategoryModalOpen(false);
      setIsChoiceModalOpen(false);
    } else if (initialModal === "category") {
      setIsTaskModalOpen(false);
      setIsCategoryModalOpen(true);
      setIsChoiceModalOpen(false);
    } else {
      setIsTaskModalOpen(false);
      setIsCategoryModalOpen(false);
      setIsChoiceModalOpen(true);
    }
  }, [initialModal]);

  const addSubTask = () => {
    if (!newSubTaskTitle.trim()) {
      toast("Sub-task title cannot be empty.");
      return;
    }
    if (
      subTasks.some(
        (subTask) =>
          subTask.title.toLowerCase() === newSubTaskTitle.trim().toLowerCase()
      )
    ) {
      toast("A sub-task with this title already exists.");
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
      const taskData = { ...data, subTasks: data.subTasks || [] };
      setIsHandling(true);
      const res = await createTask(taskData);
      if (res?.error) {
        toast(res.error);
      }
      if (res?.success && res?.task) {
        addTask(res.task);
        toast(res.success);
      }
      form.reset();
      setSubTasks([]);
      setNewSubTaskTitle("");
      onOpenChange(false);
    } catch (error) {
      toast("Failed to add task");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  const onCategorySubmit = async (data: CategoryFormData) => {
    try {
      setIsHandling(true);
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
      toast("Category added");
      categoryForm.reset();
      setIsCategoryModalOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  const handleClose = () => {
    if (!isHandling) {
      form.reset();
      setSubTasks([]);
      setNewSubTaskTitle("");
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={isChoiceModalOpen && open}
        onOpenChange={(open) => {
          setIsChoiceModalOpen(open);
          if (!open) onOpenChange(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button
              onClick={() => {
                setIsChoiceModalOpen(false);
                setIsTaskModalOpen(true);
              }}
            >
              Add Task
            </Button>
            <Button
              onClick={() => {
                setIsChoiceModalOpen(false);
                setIsCategoryModalOpen(true);
              }}
            >
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskModalOpen && open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
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
                  <div className="mt-2 space-y-2">
                    {subTasks.map((subTask) => (
                      <Badge
                        variant="secondary"
                        key={subTask._id}
                        className="group flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs transition hover:bg-muted/80"
                      >
                        <span className="text-sm text-foreground">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
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
                              {category.name}
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
                      Adding...
                    </>
                  ) : (
                    "Add Task"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCategoryModalOpen && open}
        onOpenChange={(open) => {
          setIsCategoryModalOpen(open);
          if (!open) {
            categoryForm.reset();
            onOpenChange(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form
              onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
              className="space-y-4"
            >
              <FormField
                control={categoryForm.control}
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
                control={categoryForm.control}
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
                          .filter((c) => !c.parentId || c.parentId === null)
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
                control={categoryForm.control}
                name="taskIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Tasks</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={tasks
                          .filter((task) => !task.categoryId)
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
                control={categoryForm.control}
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
                    categoryForm.reset();
                    setIsCategoryModalOpen(false);
                    onOpenChange(false);
                  }}
                  disabled={isHandling}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isHandling}>
                  {isHandling ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
