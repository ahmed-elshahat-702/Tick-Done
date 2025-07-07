"use client";

import { TTask } from "@/types/task";
import { TCategory } from "@/types/category";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TaskStore {
  tasks: TTask[];
  categories: TCategory[];
  isLoading: boolean;
  isHandling: boolean;
  setIsLoading: (state: boolean) => void;
  setIsHandling: (state: boolean) => void;
  error: string | null;
  setTasks: (newTasks: TTask[]) => void;
  addTask: (task: TTask) => void;
  editTask: (id: string, data: Partial<TTask>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setCategories: (newCategories: TCategory[]) => void;
  addCategory: (category: TCategory) => void;
  updateTasksCategory: (taskIds: string[], categoryId: string | null) => void;
  removeTasksCategory: (taskIds: string[]) => void; // New action
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      categories: [],
      isLoading: false,
      isHandling: false,
      setIsLoading: (state) => set({ isLoading: state }),
      setIsHandling: (state) => set({ isHandling: state }),
      error: null,

      setTasks: (newTasks) => set({ tasks: newTasks }),
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),

      editTask: async (id, data) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task._id === id ? { ...task, ...data, updatedAt: new Date() } : task
          ),
        })),

      removeTask: async (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task._id !== id),
        })),

      setCategories: (newCategories) => set({ categories: newCategories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),

      updateTasksCategory: (taskIds, categoryId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task._id)
              ? { ...task, categoryId: categoryId || undefined }
              : task
          ),
        })),

      // New action to explicitly remove tasks from categories
      removeTasksCategory: (taskIds) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task._id)
              ? { ...task, categoryId: undefined }
              : task
          ),
        })),

      clearError: () => set({ error: null }),
    }),
    {
      name: "tick-done-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
      }),
    }
  )
);
