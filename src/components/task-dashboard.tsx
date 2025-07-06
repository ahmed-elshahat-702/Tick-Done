"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { TaskList } from "@/components/task-view";
import { AddTaskModal } from "@/components/add-task-modal";
import { CalendarView } from "@/components/calendar-view";
import { ProfileSettings } from "@/components/profile-settings";
import { useTaskStore } from "@/lib/store";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { toast } from "sonner";
import CategoryList from "./category-list";
import TodayView from "./today-view";
import CompletedView from "./completed-view";

export function TaskDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { isLoading, setIsLoading, error, setTasks } = useTaskStore();

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <LoadingSpinner className="h-8 w-8 mx-auto" />
            <p className="text-muted-foreground">Loading your tasks...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "today":
        return <TodayView />;
      case "completed":
        return <CompletedView />;
      case "calendar":
        return <CalendarView />;
      case "categories":
        return <CategoryList />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <TaskList />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">{renderContent()}</div>

        {activeView !== "categories" && (
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
