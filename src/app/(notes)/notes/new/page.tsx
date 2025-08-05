import { TaskDashboard } from "@/components/layout/task-dashboard";
import React from "react";
import NewNoteView from "./new-note-view";

const page = () => {
  return (
    <TaskDashboard>
      <NewNoteView />
    </TaskDashboard>
  );
};

export default page;
