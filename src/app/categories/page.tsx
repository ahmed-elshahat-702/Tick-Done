import CategoryList from "./category-list";
import { TaskDashboard } from "@/components/task-dashboard";

export default function CategoriesPage() {
  return (
    <TaskDashboard>
      <CategoryList />
    </TaskDashboard>
  );
}
