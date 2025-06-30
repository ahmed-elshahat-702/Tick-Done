"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tag?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  initializeTasks: () => Promise<void>;
  addTask: (
    task: Omit<Task, "id" | "createdAt" | "updatedAt" | "status" | "userId">
  ) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,

      initializeTasks: async () => {
        try {
          set({ isLoading: true, error: null });
          await delay(1000); // Simulate API call

          // Initialize with sample tasks if none exist
          const currentTasks = get().tasks;
          if (currentTasks.length === 0) {
            const sampleTasks: Task[] = [
              {
                id: "1",
                title: "Complete project proposal",
                description:
                  "Write and submit the Q1 project proposal for the new client",
                status: "in-progress",
                priority: "high",
                dueDate: new Date(
                  Date.now() + 2 * 24 * 60 * 60 * 1000
                ).toISOString(),
                tag: "work",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "2",
                title: "Review team performance",
                description:
                  "Conduct quarterly performance reviews for team members",
                status: "todo",
                priority: "medium",
                dueDate: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                tag: "management",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "3",
                title: "Update website content",
                description:
                  "Refresh the about page and add new team member profiles",
                status: "done",
                priority: "low",
                dueDate: new Date(
                  Date.now() - 1 * 24 * 60 * 60 * 1000
                ).toISOString(),
                tag: "website",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];
            set({ tasks: sampleTasks });
          }
        } catch (error) {
          set({ error: `Failed to load tasks. Please try again.` });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      addTask: async (taskData) => {
        try {
          set({ isLoading: true, error: null });
          await delay(500); // Simulate API call

          const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            status: "todo" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            tasks: [...state.tasks, newTask],
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: `Failed to add tasks. Please try again.`,
            isLoading: false,
          });
          console.error(error);
        }
      },

      updateTask: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          await delay(300); // Simulate API call

          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: `Failed to update tasks. Please try again`,
            isLoading: false,
          });
          console.error(error);
        }
      },

      deleteTask: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await delay(300); // Simulate API call

          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: `Failed to delete tasks. Please try again.`,
            isLoading: false,
          });
          console.error(error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tick-done-storage",
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
