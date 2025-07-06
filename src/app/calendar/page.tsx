import { CalendarView } from "@/app/calendar/calendar-view";
import { TaskDashboard } from "@/components/task-dashboard";

export default function CalendarPage() {
  return (
    <TaskDashboard>
      <CalendarView />
    </TaskDashboard>
  );
}
