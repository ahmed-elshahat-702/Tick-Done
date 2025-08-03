import CompletedView from "@/app/completed/completed-view";
import { TaskDashboard } from "@/components/layout/task-dashboard";

export default function CompletedPage() {
  return (
    <TaskDashboard>
      <CompletedView />
    </TaskDashboard>
  );
}
