import { TaskDashboard } from "@/components/task-dashboard";
import PomodoroView from "./pomodoro-view";

export default function PomodoroTimer() {
  return (
    <TaskDashboard>
      <PomodoroView />
    </TaskDashboard>
  );
}
