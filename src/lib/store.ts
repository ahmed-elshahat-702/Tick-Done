"use client";

import { TTask } from "@/types/task";
import { ObjectId } from "mongoose";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TaskStore {
  tasks: TTask[];
  isLoading: boolean;
  isHandling: boolean;
  setIsLoading: (state: boolean) => void;
  setIsHandling: (state: boolean) => void;
  error: string | null;
  setTasks: (newTasks: TTask[]) => void;
  addTask: (task: TTask) => void;
  // updateTask: (id: string, updates: Partial<TTask>) => Promise<void>;
  removeTask: (id: ObjectId) => Promise<void>;
  clearError: () => void;
}

// Simulate API delay
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      isLoading: false,
      isHandling: false,
      setIsLoading: (state) => {
        set({ isLoading: state });
      },
      setIsHandling: (state) => {
        set({ isHandling: state });
      },
      error: null,

      setTasks: async (newTasks) => {
        set({ tasks: newTasks });
      },
      addTask: async (task) => {
        set((state) => ({ tasks: [task, ...state.tasks] }));
      },

      // updateTask: async (id, updates) => {
      //   try {
      //     set({ isLoading: true, error: null });
      //     await delay(300); // Simulate API call

      //     set((state) => ({
      //       tasks: state.tasks.map((task) =>
      //         task.id === id
      //           ? { ...task, ...updates, updatedAt: new Date().toISOString() }
      //           : task
      //       ),
      //       isLoading: false,
      //     }));
      //   } catch (error) {
      //     set({
      //       error: `Failed to update tasks. Please try again`,
      //       isLoading: false,
      //     });
      //     console.error(error);
      //   }
      // },

      removeTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task._id !== id),
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tick-done-storage",
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
