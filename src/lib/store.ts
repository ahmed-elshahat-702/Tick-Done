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
  editTask: (id: ObjectId, data: Partial<TTask>) => Promise<void>;
  removeTask: (id: ObjectId) => Promise<void>;
  clearError: () => void;
}

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

      editTask: async (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task._id === id ? { ...task, ...data, updatedAt: new Date() } : task
          ),
        }));
      },

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
