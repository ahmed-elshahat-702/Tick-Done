"use client";

import {
  deleteTask,
  updateSubTaskStatus,
  updateTaskStatus,
} from "@/actions/tasks";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TTask } from "@/types/task";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TaskCardProps {
  task: TTask & { categoryName?: string; categoryColor?: string }; // Extend TTask with optional category fields
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

export function TaskCard({ task }: TaskCardProps) {
  const { editTask, removeTask, isHandling, setIsHandling } = useTaskStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskUpdating, setIsTaskUpdating] = useState(false);
  const [updatingSubTaskId, setUpdatingSubTaskId] = useState<string | null>(
    null
  );
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

  const dingAudio =
    typeof Audio !== "undefined" ? new Audio("/sounds/check.mp3") : null;

  const handleStatusChange = async (checked: boolean) => {
    try {
      setIsTaskUpdating(true);
      const res = await updateTaskStatus(task._id, checked ? "done" : "todo");
      if (res?.error) {
        toast(res.error);
      }
      if (res?.success && res?.task) {
        await editTask(task._id, {
          status: checked ? "done" : "todo",
        });
        toast(
          checked
            ? "Great job on completing this task."
            : "Task moved back to todo."
        );
        if (checked && dingAudio) {
          dingAudio.currentTime = 0;
          dingAudio.play().catch((e) => console.warn("Audio play failed:", e));
        }
      }
    } catch (error) {
      toast(`Failed to update task status. Please try again.`);
      console.error(error);
    } finally {
      setIsTaskUpdating(false);
    }
  };

  const handleSubTaskStatusChange = async (
    subTaskId: string,
    checked: boolean
  ) => {
    try {
      setUpdatingSubTaskId(subTaskId);
      const newStatus: "todo" | "done" = checked ? "done" : "todo";
      const res = await updateSubTaskStatus(task._id, subTaskId, newStatus);
      if (res?.error) {
        toast(res.error);
      }
      if (res?.success && res?.task) {
        await editTask(task._id, { subTasks: res.task.subTasks });
        toast(checked ? "Sub-task completed!" : "Sub-task marked as todo.");
        if (checked && dingAudio) {
          dingAudio.currentTime = 0;
          dingAudio.play().catch((e) => console.warn("Audio play failed:", e));
        }
      }
    } catch (error) {
      toast(`Failed to update sub-task status. Please try again.`);
      console.error(error);
    } finally {
      setUpdatingSubTaskId(null);
    }
  };

  const handleDelete = async () => {
    try {
      setIsHandling(true);
      const res = await deleteTask(task._id);
      if (res?.error) {
        toast(res.error);
      }
      await removeTask(task._id);
      toast(res?.success);
    } catch (error) {
      toast(`Failed to delete task. Please try again.`);
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== "done";

  return (
    <>
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          task.status === "done" && "opacity-60",
          isOverdue && "border-red-200 dark:border-red-800",
          (isHandling || isTaskUpdating) && "opacity-50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={handleStatusChange}
                className={`mt-1 ${
                  isTaskUpdating || isHandling ? "opacity-0" : ""
                }`}
              />
              {isTaskUpdating && (
                <LoadingSpinner className="absolute inset-0 top-1 h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    "font-medium text-sm break-words",
                    task.status === "done" &&
                      "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>

                <div className="flex items-center gap-2">
                  {task.subTasks && task.subTasks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSubTasksOpen(!isSubTasksOpen)}
                      className="h-8 w-8 flex-shrink-0"
                    >
                      {isSubTasksOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        disabled={isHandling}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {task.categoryName && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      backgroundColor: `${task.categoryColor}20`, // 20% opacity for background
                      color: task.categoryColor,
                      borderColor: task.categoryColor,
                    }}
                  >
                    {task.categoryName}
                  </Badge>
                )}

                <Badge
                  variant="secondary"
                  className={cn("text-xs", priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn("text-xs", statusColors[task.status])}
                >
                  {task.status.replace("-", " ")}
                </Badge>

                {task.tag && (
                  <Badge variant="outline" className="text-xs">
                    {task.tag}
                  </Badge>
                )}

                {dueDate && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      isOverdue ? "text-red-600" : "text-muted-foreground"
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {format(dueDate, "MMM d")}
                    {isOverdue && <Clock className="h-3 w-3" />}
                  </div>
                )}
              </div>

              {isSubTasksOpen && task.subTasks && task.subTasks.length > 0 && (
                <div className="mt-4 space-y-2 pl-6">
                  {task.subTasks.map((subTask) => (
                    <div key={subTask._id} className="flex items-center gap-2">
                      <div className="relative">
                        <Checkbox
                          checked={subTask.status === "done"}
                          onCheckedChange={(checked) =>
                            handleSubTaskStatusChange(
                              subTask._id,
                              checked as boolean
                            )
                          }
                          className={`mt-1 ${
                            updatingSubTaskId === subTask._id ? "opacity-0" : ""
                          }`}
                        />
                        {updatingSubTaskId === subTask._id && (
                          <LoadingSpinner className="absolute inset-0 top-1 h-4 w-4" />
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          subTask.status === "done" &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {subTask.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={task}
      />
    </>
  );
}
