"use client";

import { useState } from "react";
import { Calendar, Clock, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore, type Task } from "@/lib/store";
import { AddTaskModal } from "@/components/add-task-modal";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
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
  const { updateTask, deleteTask, isLoading } = useTaskStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      await updateTask(task.id, {
        status: checked ? "done" : "todo",
      });
      toast(
        checked
          ? "Great job on completing this task."
          : "Task moved back to todo."
      );
    } catch (error) {
      toast(`Failed to update task status. Please try again.`);
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast("The task has been removed successfully.");
    } catch (error) {
      toast(`Failed to delete task status. Please try again.`);
      console.error(error);
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
          (isLoading || isUpdating) && "opacity-50"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={handleStatusChange}
                className="mt-1"
                disabled={isLoading || isUpdating}
              />
              {isUpdating && (
                <LoadingSpinner className="absolute inset-0 h-4 w-4" />
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      disabled={isLoading}
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

              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <AddTaskModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={task}
      />
    </>
  );
}
