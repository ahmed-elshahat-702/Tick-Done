"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import ListCard from "./task-list-card";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const ListsView = () => {
  const { lists, tasks, error, isLoading } = useAppStore();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error("Error loading tasks/lists:", error);
    }
  }, [error]);

  // ✅ Auto-select "My Tasks" by ObjectId on mount
  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      const allTasksList = lists.find((l) => l.name === "My Tasks");
      if (allTasksList) {
        setSelectedListId(allTasksList._id);
      }
    }
  }, [lists, selectedListId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your lists...</p>
        </div>
      </div>
    );
  }

  // ✅ Cleaned up: just compare _id
  const selectedList = lists.find((l) => l._id === selectedListId);

  return (
    <section className="space-y-6 -mx-4 md:-mx-6 overflow-hidden">
      {/* List Selector Slider */}
      {lists.length > 0 && (
        <Swiper spaceBetween={20} slidesPerView="auto" className="border-b">
          {lists
            .slice()
            .sort((a, b) =>
              a.name === "My Tasks" ? -1 : b.name === "My Tasks" ? 1 : 0
            )
            .map((list) => (
              <SwiperSlide
                key={list._id}
                style={{ width: "auto" }}
                className="space-x-0"
              >
                <button
                  onClick={() => setSelectedListId(list._id)}
                  className={`min-w-28 md:min-w-52 px-8 py-2 mx-0 text-sm transition ${
                    selectedListId === list._id
                      ? "border-b-4 border-blue-500"
                      : ""
                  }`}
                >
                  {list.name}
                </button>
              </SwiperSlide>
            ))}
        </Swiper>
      )}

      {/* Tasks in Selected List */}
      <div className="px-4">
        {selectedList ? (
          <ListCard
            list={selectedList}
            tasks={tasks}
            setSelectedListId={setSelectedListId}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No list selected.</p>
        )}
      </div>
    </section>
  );
};

export default ListsView;
