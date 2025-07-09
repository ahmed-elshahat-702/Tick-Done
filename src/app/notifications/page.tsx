import NotificationPage from "@/components/layout/push-notification-manager";
import { TaskDashboard } from "@/components/task-dashboard";
import React from "react";

const page = () => {
  return (
    <TaskDashboard>
      <NotificationPage />
    </TaskDashboard>
  );
};

export default page;
