import { TaskDashboard } from "@/components/task-dashboard";
import Pomodoro from "./pomodoro-view";

export default function PomodoroTimer() {
  return (
    <TaskDashboard>
      <Pomodoro />
    </TaskDashboard>
  );
}
