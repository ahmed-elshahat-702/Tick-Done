import { ProfileSettings } from "./profile-settings";
import { TaskDashboard } from "@/components/layout/task-dashboard";

export default function ProfilePage() {
  return (
    <TaskDashboard>
      <ProfileSettings />
    </TaskDashboard>
  );
}
