"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { TaskCategory } from "@/models/TaskCategory";
import { User } from "@/models/User";
import { Task } from "@/models/Task";
import { CategoryFormData } from "@/validation/Category";
import { revalidatePath } from "next/cache";
import { toPlainObject } from "../lib/utils";
import { TCategory } from "@/types/category";

const trimName = (name: string) =>
  name
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export async function getTaskCategories() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    const categories = await TaskCategory.find({ userId: user._id }).lean();
    return {
      success: "Categories fetched successfully!",
      categories: categories.map((category) =>
        toPlainObject<TCategory>(category)
      ),
    };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { error: "Failed to fetch categories" };
  }
}

export async function createTaskCategory(categoryData: CategoryFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    const isExisting = await TaskCategory.findOne({
      name: trimName(categoryData.name),
      userId: user._id,
    });
    if (isExisting) return { error: "Category with this name already exists." };

    if (categoryData.parentId) {
      const parentCategory = await TaskCategory.findOne({
        _id: categoryData.parentId,
        userId: user._id,
      });
      if (!parentCategory) return { error: "Invalid parent category" };
    }

    const category = await TaskCategory.create({
      ...categoryData,
      name: trimName(categoryData.name),
      userId: user._id,
      color: categoryData.color || "#000000",
    });

    // Assign tasks to the new category
    if (categoryData.taskIds && categoryData.taskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: categoryData.taskIds }, userId: user._id },
        { $set: { categoryId: category._id } }
      );
    }

    revalidatePath("/");
    return {
      success: "Category created successfully!",
      category: toPlainObject<TCategory>(category),
    };
  } catch (error) {
    console.error("Failed to add new category:", error);
    return { error: "Failed to create category" };
  }
}

export async function updateTaskCategory(
  categoryId: string,
  categoryData: CategoryFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!categoryId) return { error: "Category ID is required." };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    const isExisting = await TaskCategory.findOne({
      name: trimName(categoryData.name),
      userId: user._id,
    });
    if (isExisting && isExisting._id != categoryId)
      return { error: "Category with this name already exists." };

    if (categoryData.parentId) {
      const parentCategory = await TaskCategory.findOne({
        _id: categoryData.parentId,
        userId: user._id,
      });
      if (!parentCategory) return { error: "Invalid parent category" };
      if (categoryData.parentId === categoryId)
        return { error: "Category cannot be its own parent" };
    }

    const category = await TaskCategory.findByIdAndUpdate(
      categoryId,
      {
        ...categoryData,
        name: trimName(categoryData.name),
        color: categoryData.color || "#000000",
      },
      { new: true, runValidators: true }
    );

    if (!category) return { error: "Category not found!" };

    // Update task assignments
    await Task.updateMany(
      { categoryId: categoryId, userId: user._id },
      { $set: { categoryId: null } } // Unassign tasks from this category
    );
    if (categoryData.taskIds && categoryData.taskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: categoryData.taskIds }, userId: user._id },
        { $set: { categoryId: category._id } }
      );
    }

    revalidatePath("/");
    return {
      success: "Category updated successfully!",
      category: toPlainObject<TCategory>(category),
    };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { error: "Failed to update category" };
  }
}

export async function deleteTaskCategory(
  categoryId: string,
  deleteTasks: boolean = false
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!categoryId) return { error: "Category ID is required." };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    async function getAllDescendantCategoryIds(
      parentId: string | string
    ): Promise<string[]> {
      const children = await TaskCategory.find(
        { parentId: parentId, userId: user._id },
        "_id"
      );
      let ids: string[] = children.map((cat: TCategory) => cat._id);
      for (const child of children) {
        ids = ids.concat(await getAllDescendantCategoryIds(child._id));
      }
      return ids;
    }

    const descendantCategoryIds = await getAllDescendantCategoryIds(categoryId);
    const allCategoryIds = [categoryId, ...descendantCategoryIds];

    if (deleteTasks) {
      await Task.deleteMany({
        categoryId: { $in: allCategoryIds },
        userId: user._id,
      });
    } else {
      await Task.updateMany(
        { categoryId: { $in: allCategoryIds }, userId: user._id },
        { $set: { categoryId: null } }
      );
    }

    await TaskCategory.deleteMany({
      _id: { $in: allCategoryIds },
      userId: user._id,
    });

    revalidatePath("/");
    return { success: "Category and all subcategories deleted successfully" };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { error: "Failed to delete category" };
  }
}
