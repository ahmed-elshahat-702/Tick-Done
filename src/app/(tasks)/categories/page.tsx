import CategoryList from "./category-list";
import { TaskDashboard } from "@/components/layout/task-dashboard";

export default function CategoriesPage() {
  return (
    <TaskDashboard>
      <CategoryList />
    </TaskDashboard>
  );
}
