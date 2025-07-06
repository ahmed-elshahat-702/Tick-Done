import { TaskDashboard } from "@/components/task-dashboard";
import TodayView from "./today-view";

export default function TodayPage() {
  return (
    <TaskDashboard>
      <TodayView />
    </TaskDashboard>
  );
}
