"use client";
import { TaskCard } from "@/components/tasks/task-card";
import { useAppStore } from "@/lib/store";

const CompletedView = () => {
  const { tasks } = useAppStore();

  const completedTasks = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Completed tasks</h2>
          <p className="text-muted-foreground">
            {completedTasks.length}
            {completedTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
      </div>
      {completedTasks.map((task) => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  );
};

export default CompletedView;
