import { TaskDashboard } from "@/components/layout/task-dashboard";
import NoteView from "./note-view";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) {
    return <div>Note not found</div>;
  }

  return (
    <TaskDashboard>
      <NoteView id={id} />
    </TaskDashboard>
  );
};

export default page;
