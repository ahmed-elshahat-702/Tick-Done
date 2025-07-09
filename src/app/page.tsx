"use client";

import { TaskDashboard } from "@/components/task-dashboard";
import { TaskView } from "@/components/tasks/task-view";

export default function Home() {
  return (
    <TaskDashboard>
      <TaskView />
    </TaskDashboard>
  );
}
