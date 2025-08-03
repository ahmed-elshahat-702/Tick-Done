import { CalendarView } from "@/app/calendar/calendar-view";
import { TaskDashboard } from "@/components/layout/task-dashboard";

export default function CalendarPage() {
  return (
    <TaskDashboard>
      <CalendarView />
    </TaskDashboard>
  );
}
