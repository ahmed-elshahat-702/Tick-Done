"use client";

import { TaskCard } from "@/components/tasks/task-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { TTask } from "@/types/task";
import { useState } from "react";

const CategoriesTabs = ({ tasks }: { tasks: TTask[] }) => {
  const { categories } = useAppStore();
  const [activeTab, setActiveTab] = useState("all");
  const [subTab, setSubTab] = useState<string | null>(null);
  const [showAllParentTasks, setShowAllParentTasks] = useState(true);

  const mappedTasks = tasks.map((task) => ({
    ...task,
    categoryName: categories.find((c) => c._id === task.categoryId)?.name,
    categoryColor:
      categories.find((c) => c._id === task.categoryId)?.color || "#000000",
  }));

  const topLevelCategories = categories.filter(
    (category) => !category.parentId
  );

  const getSubCategories = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const filteredTasks = mappedTasks.filter((task) => {
    if (activeTab === "all") {
      return true;
    }
    if (activeTab === "category-uncategorized") {
      return !task.categoryId;
    }
    const activeCategoryId = activeTab.replace("category-", "");
    if (subTab && subTab.startsWith("subcategory-")) {
      const subCategoryId = subTab.replace("subcategory-", "");
      return task.categoryId === subCategoryId;
    }
    if (subTab === "only" && activeTab === `category-${activeCategoryId}`) {
      return task.categoryId === activeCategoryId;
    }
    if (activeTab === `category-${activeCategoryId}`) {
      if (showAllParentTasks) {
        const subCategoryIds = getSubCategories(activeCategoryId).map(
          (c) => c._id
        );
        return (
          task.categoryId === activeCategoryId ||
          subCategoryIds.includes(task.categoryId || "")
        );
      }
      return task.categoryId === activeCategoryId;
    }
    return false;
  });

  const handleTabChange = (value: string) => {
    if (value === activeTab && value.startsWith("category-") && !subTab) {
      setShowAllParentTasks(!showAllParentTasks);
    } else {
      setShowAllParentTasks(true);
    }
    setActiveTab(value);
  };

  const handleSubTabChange = (value: string) => {
    if (
      value !== subTab &&
      !value.startsWith("subcategory-") &&
      value !== "only"
    ) {
      setSubTab(null);
    } else {
      setSubTab(value);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      defaultValue="all"
      className="space-y-4"
    >
      <div className="space-y-2">
        <h5 className="text-sm font-semibold">Categories</h5>
        <TabsList className="h-fit flex items-start gap-2 flex-wrap justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="category-uncategorized">
            Uncategorized
          </TabsTrigger>
          {topLevelCategories.map((category) => (
            <TabsTrigger
              key={category._id}
              value={`category-${category._id}`}
              className="max-w-50"
            >
              <span className="truncate line-clamp-1">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="all">
        <div className="grid gap-4 mt-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first task to get started
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="category-uncategorized">
        <div className="grid gap-4 mt-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-2">
                No tasks without a category
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      {topLevelCategories.map((category) => {
        const subCategories = getSubCategories(category._id);
        return (
          <TabsContent key={category._id} value={`category-${category._id}`}>
            <div className="space-y-4">
              {subCategories.length > 0 && (
                <Tabs
                  value={subTab || `category-${category._id}`}
                  onValueChange={handleSubTabChange}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Sub Categories</h5>
                    <TabsList className="h-fit flex items-start gap-2 flex-wrap justify-start">
                      <TabsTrigger value={`category-${category._id}`}>
                        {showAllParentTasks ? "All" : "(Direct)"}
                      </TabsTrigger>
                      <TabsTrigger value="only">
                        {category.name} (only)
                      </TabsTrigger>
                      {subCategories.map((subCategory) => (
                        <TabsTrigger
                          key={subCategory._id}
                          value={`subcategory-${subCategory._id}`}
                          className="max-w-50"
                        >
                          <span className="truncate line-clamp-1">
                            {subCategory.name}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value={`category-${category._id}`}>
                    <div className="grid gap-4 mt-6">
                      {filteredTasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))}
                      {filteredTasks.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            No tasks found
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            No tasks in this category
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="only">
                    <div className="grid gap-4 mt-6">
                      {filteredTasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))}
                      {filteredTasks.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            No tasks found
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            No tasks in this category only
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {subCategories.map((subCategory) => (
                    <TabsContent
                      key={subCategory._id}
                      value={`subcategory-${subCategory._id}`}
                    >
                      <div className="grid gap-4 mt-6">
                        {filteredTasks.map((task) => (
                          <TaskCard key={task._id} task={task} />
                        ))}
                        {filteredTasks.length === 0 && (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">
                              No tasks found
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              No tasks in this sub-category
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              {subCategories.length === 0 && (
                <div className="grid gap-4 mt-6">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No tasks found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        No tasks in this category
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default CategoriesTabs;
