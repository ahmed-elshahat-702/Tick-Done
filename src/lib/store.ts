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
  error: string | null;
  startTime: number | null; // Timestamp in ms
  endTime: number | null; // Timestamp in ms
  duration: number; // Duration in seconds
  isRunning: boolean;
  isWorkSession: boolean;
  workDuration: number; // Work duration in minutes
  breakDuration: number; // Break duration in minutes
  setIsLoading: (state: boolean) => void;
  setIsHandling: (state: boolean) => void;
  setTasks: (newTasks: TTask[]) => void;
  addTask: (task: TTask) => void;
  editTask: (id: string, data: Partial<TTask>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  setCategories: (newCategories: TCategory[]) => void;
  addCategory: (category: TCategory) => void;
  updateTasksCategory: (taskIds: string[], categoryId: string | null) => void;
  removeTasksCategory: (taskIds: string[]) => void;
  clearError: () => void;
  setTimer: (
    startTime: number | null,
    endTime: number | null,
    duration: number,
    isRunning: boolean,
    isWorkSession: boolean
  ) => void;
  setDurations: (workDuration: number, breakDuration: number) => void;
  clearTimer: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      categories: [],
      isLoading: false,
      isHandling: false,
      error: null,
      startTime: null,
      endTime: null,
      duration: 25 * 60,
      isRunning: false,
      isWorkSession: true,
      workDuration: 25,
      breakDuration: 5,

      setIsLoading: (state) => set({ isLoading: state }),
      setIsHandling: (state) => set({ isHandling: state }),

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

      removeTasksCategory: (taskIds) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task._id)
              ? { ...task, categoryId: undefined }
              : task
          ),
        })),

      clearError: () => set({ error: null }),

      setTimer: (startTime, endTime, duration, isRunning, isWorkSession) =>
        set({ startTime, endTime, duration, isRunning, isWorkSession }),

      setDurations: (workDuration, breakDuration) =>
        set({ workDuration, breakDuration }),

      clearTimer: () =>
        set({
          startTime: null,
          endTime: null,
          duration: 25 * 60,
          isRunning: false,
          isWorkSession: true,
        }),
    }),
    {
      name: "tick-done-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        startTime: state.startTime,
        endTime: state.endTime,
        duration: state.duration,
        isRunning: state.isRunning,
        isWorkSession: state.isWorkSession,
        workDuration: state.workDuration,
        breakDuration: state.breakDuration,
      }),
    }
  )
);
