import { ProfileSettings } from "./profile-settings";
import { TaskDashboard } from "@/components/task-dashboard";

export default function ProfilePage() {
  return (
    <TaskDashboard>
      <ProfileSettings />
    </TaskDashboard>
  );
}
