import { TaskDashboard } from "@/components/layout/task-dashboard";
import NotesView from "./notes-view";

const Page = () => {
  return (
    <TaskDashboard>
      <NotesView />
    </TaskDashboard>
  );
};

export default Page;
