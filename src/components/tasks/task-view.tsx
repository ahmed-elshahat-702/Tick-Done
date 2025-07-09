"use client";

import { useTaskStore } from "@/lib/store";
import CategoriesTabs from "../categories-tabs";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { useEffect } from "react";
import { toast } from "sonner";

export function TaskView() {
  const { isLoading, setIsLoading, error, tasks, setTasks } = useTaskStore();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (data.tasks) {
          setTasks(data.tasks);
        } else {
          toast.error(data.error || "Failed to fetch tasks");
        }
      } catch (error) {
        console.error("Failed to fetch tasks", error);
        toast("Failed to fetch tasks");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [setIsLoading, setTasks]);

  useEffect(() => {
    if (error) {
      toast(error);
      console.error("Error loading tasks:", error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All tasks</h2>
          <p className="text-muted-foreground">
            {tasks.length}
            {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
      </div>
      <CategoriesTabs tasks={tasks} />
    </div>
  );
}
