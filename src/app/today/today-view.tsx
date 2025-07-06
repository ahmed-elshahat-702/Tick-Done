"use client";

import { useTaskStore } from "@/lib/store";
import CategoriesTabs from "@/components/categories-tabs";

const TodayView = () => {
  const { tasks } = useTaskStore();

  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;

    const dueDate = new Date(task.dueDate);

    return dueDate >= startOfToday && dueDate < endOfToday;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Today&apos;s tasks
          </h2>
          <p className="text-muted-foreground">
            {todayTasks.length}
            {todayTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
      </div>
      <CategoriesTabs tasks={todayTasks} />
    </div>
  );
};

export default TodayView;
