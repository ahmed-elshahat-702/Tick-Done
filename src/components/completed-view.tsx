import React from "react";
import CategoriesTabs from "./categories-tabs";
import { useTaskStore } from "@/lib/store";

const CompletedView = () => {
  const { tasks } = useTaskStore();

  const completedTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Today&apos;s tasks
          </h2>
          <p className="text-muted-foreground">
            {completedTasks.length}
            {completedTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
      </div>
      <CategoriesTabs tasks={completedTasks} />
    </div>
  );
};

export default CompletedView;
