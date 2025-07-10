"use client";

import { TTask } from "@/types/task";
import { TCategory } from "@/types/category";
import { TList } from "@/types/list";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TaskStore {
  tasks: TTask[];
  categories: TCategory[];
  lists: TList[];
  isLoading: boolean;
  isHandling: boolean;
  error: string | null;

  isRunning: boolean;
  isWorkSession: boolean;
  startTime: string | null;
  endTime: string | null;
  sessionDuration: number;

  setSession: (isWork: boolean, duration: number) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setIsRunning: (state: boolean) => void;
  setIsWorkSession: (state: boolean) => void;
  setSessionDuration: (duration: number) => void;

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

  setLists: (newLists: TList[]) => void;
  addList: (list: TList) => void;
  updateTasksList: (taskIds: string[], listId: string | null) => void;
  removeTasksList: (taskIds: string[]) => void;

  clearError: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: [],
      lists: [],
      isLoading: false,
      isHandling: false,
      error: null,

      isRunning: false,
      isWorkSession: true,
      startTime: null,
      endTime: null,
      sessionDuration: 25 * 60,

      setSession: (isWork, duration) =>
        set({
          isWorkSession: isWork,
          sessionDuration: duration,
        }),

      start: () => {
        const now = new Date();
        const end = new Date(now.getTime() + get().sessionDuration * 1000);
        set({
          isRunning: true,
          startTime: now.toISOString(),
          endTime: end.toISOString(),
        });
      },

      stop: () => set({ isRunning: false }),

      reset: () =>
        set({
          isRunning: false,
          startTime: null,
          endTime: null,
        }),

      setIsRunning: (state) => set({ isRunning: state }),
      setIsWorkSession: (state) => set({ isWorkSession: state }),
      setSessionDuration: (duration) => set({ sessionDuration: duration }),

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

      setLists: (newLists) => set({ lists: newLists }),
      addList: (list) => set((state) => ({ lists: [...state.lists, list] })),

      updateTasksList: (taskIds, listId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task._id)
              ? { ...task, listId: listId || undefined }
              : task
          ),
        })),

      removeTasksList: (taskIds) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task._id) ? { ...task, listId: undefined } : task
          ),
        })),

      clearError: () => set({ error: null }),
    }),
    {
      name: "tick-done-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        categories: state.categories,
        lists: state.lists,
        isRunning: state.isRunning,
        isWorkSession: state.isWorkSession,
        startTime: state.startTime,
        endTime: state.endTime,
        sessionDuration: state.sessionDuration,
      }),
    }
  )
);
