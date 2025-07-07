"use client";

import { getTaskCategories } from "@/actions/task-categories";
import CategoryCard from "@/app/categories/category-card";
import { useTaskStore } from "@/lib/store";
import { useEffect } from "react";
import { toast } from "sonner";

const CategoryList = () => {
  const { categories, setCategories } = useTaskStore();

  useEffect(() => {
    async function fetchCategories() {
      const res = await getTaskCategories();
      if (res.categories) {
        setCategories(res.categories);
      } else {
        toast.error(res.error || "Failed to fetch categories");
      }
    }
    fetchCategories();
  }, [setCategories]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Task Categories
        </h2>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No categories yet. Start by adding one.
          </p>
        ) : (
          <div className="grid gap-3 grid-cols-1">
            {categories
              .filter((category) => !category.parentId)
              .map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryList;
