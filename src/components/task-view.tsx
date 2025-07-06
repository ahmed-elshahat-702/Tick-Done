"use client";

import { useTaskStore } from "@/lib/store";
import CategoriesTabs from "./categories-tabs";

export function TaskView() {
  const { tasks } = useTaskStore();

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
