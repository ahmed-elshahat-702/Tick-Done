import CompletedView from "@/app/completed/completed-view";
import { TaskDashboard } from "@/components/task-dashboard";

export default function CompletedPage() {
  return (
    <TaskDashboard>
      <CompletedView />
    </TaskDashboard>
  );
}
