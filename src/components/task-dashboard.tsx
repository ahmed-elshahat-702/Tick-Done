"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { AddTaskModal } from "@/components/add-task-modal";
import { useTaskStore } from "@/lib/store";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export function TaskDashboard({ children }: { children: React.ReactNode }) {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { isLoading, setIsLoading, error, setTasks } = useTaskStore();
  const pathname = usePathname();

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
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden max-md:mt-16">
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>

        {pathname !== "/categories" && (
          <Button
            onClick={() => setIsAddTaskOpen(true)}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
            size="icon"
            disabled={isLoading}
          >
            <Plus className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        )}
      </main>

      <AddTaskModal open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
    </div>
  );
}
