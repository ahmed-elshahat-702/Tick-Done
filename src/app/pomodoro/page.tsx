import { TaskDashboard } from "@/components/task-dashboard";
import PomodoroView from "./pomodoro-view";
import RequestPermissionButton from "./request-permission-button";

export default function PomodoroTimer() {
  return (
    <TaskDashboard>
      <PomodoroView />
      <RequestPermissionButton />
    </TaskDashboard>
  );
}
