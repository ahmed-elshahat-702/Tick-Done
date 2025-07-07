"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { AddBoth } from "./add-both";
import { useTaskStore } from "@/lib/store";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function TaskDashboard({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "task" | "category" | "choice" | undefined
  >(undefined);
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
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
              size="icon"
              disabled={isLoading}
            >
              {isPopoverOpen ? (
                <X className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-200" />
              ) : (
                <Plus className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-200" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
            align="end"
            side="top"
            sideOffset={8}
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setModalType("task");
                  setIsAddModalOpen(true);
                }}
                className="w-full justify-start px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" />
                <span>New Task</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setModalType("category");
                  setIsAddModalOpen(true);
                }}
                className="w-full justify-start px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FolderPlus className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" />
                <span>New Category</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </main>
      <AddBoth
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        initialModal={modalType}
      />
    </div>
  );
}
