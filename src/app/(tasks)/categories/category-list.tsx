"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import CategoryCard from "@/app/(tasks)/categories/category-card";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const CategoryList = () => {
  const {
    categories,
    error,
    isLoading,
    selectedCategoryId,
    setSelectedCategoryId,
  } = useAppStore();

  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error("Error loading categories:", error);
    }
  }, [error]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      const defaultCategory = categories.find((c) => !c.parentId);
      if (defaultCategory) {
        setSelectedCategoryId(defaultCategory._id);
      }
    }
  }, [categories, selectedCategoryId, setSelectedCategoryId]);

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

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  return (
    <section className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Task Categories
      </h2>

      <div className="-mx-8 md:-mx-10 space-y-4">
        {categories.length > 0 ? (
          <Swiper spaceBetween={20} slidesPerView="auto" className="border-b">
            {categories
              .filter((category) => !category.parentId)
              .map((category) => (
                <SwiperSlide
                  key={category._id}
                  style={{ width: "auto" }}
                  className="space-x-0"
                >
                  <button
                    onClick={() => setSelectedCategoryId(category._id)}
                    className={`min-w-28 md:min-w-52 px-8 py-2 mx-0 text-sm transition ${
                      selectedCategoryId === category._id
                        ? "border-b-4 border-blue-500"
                        : ""
                    }`}
                  >
                    {category.name}
                  </button>
                </SwiperSlide>
              ))}
          </Swiper>
        ) : null}
        <div className="p-4">
          {selectedCategory ? (
            <CategoryCard category={selectedCategory} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No categories yet. Start by adding one.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryList;
