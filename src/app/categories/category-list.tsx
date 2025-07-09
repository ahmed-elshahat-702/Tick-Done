"use client";

import CategoryCard from "@/app/categories/category-card";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { useTaskStore } from "@/lib/store";
import { useEffect } from "react";
import { toast } from "sonner";

const CategoryList = () => {
  const { categories, error, isLoading } = useTaskStore();

  useEffect(() => {
    if (error) {
      toast(error);
      console.error("Error loading tasks:", error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your categories...</p>
        </div>
      </div>
    );
  }

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
