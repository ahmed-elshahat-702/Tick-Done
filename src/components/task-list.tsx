"use client";

import { TaskCard } from "@/components/task-card";
import { useTaskStore } from "@/lib/store";
import { isToday } from "date-fns";
import { LoadingSpinner } from "@/components/layout/loading-spinner";

interface TaskListProps {
  view: string;
}

export function TaskList({ view }: TaskListProps) {
  const { tasks, isLoading } = useTaskStore();

  const filteredTasks = tasks.filter((task) => {
    switch (view) {
      case "today":
        return task.dueDate && isToday(new Date(task.dueDate));
      case "completed":
        return task.status === "done";
      default:
        return true;
    }
  });

  const getTitle = () => {
    switch (view) {
      case "today":
        return "Today's Tasks";
      case "completed":
        return "Completed Tasks";
      default:
        return "All Tasks";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{getTitle()}</h2>
        <p className="text-muted-foreground">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {view === "today"
                ? "No tasks are due today"
                : view === "completed"
                ? "No completed tasks yet"
                : "Create your first task to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
