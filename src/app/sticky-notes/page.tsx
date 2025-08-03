import { TaskDashboard } from "@/components/layout/task-dashboard";
import React from "react";
import StickyNotesView from "./sticky-notes-view";

const page = () => {
  return (
    <TaskDashboard>
      <StickyNotesView />
    </TaskDashboard>
  );
};

export default page;
