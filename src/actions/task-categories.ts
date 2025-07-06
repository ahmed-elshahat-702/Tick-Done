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
import { ObjectId } from "mongoose";

const trimName = (name: string) =>
  name
    .replace(/^\s+/, "") // Trim leading spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with one
    .trim(); // Trim trailing spaces

export async function getTaskCategories() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Get user data
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

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing category with the same name
    const isExisting = await TaskCategory.findOne({
      name: trimName(categoryData.name),
      userId: user._id,
    });

    if (isExisting) {
      return { error: "Category with this name already exists." };
    }

    // Validate parentId if provided
    if (categoryData.parentId) {
      const parentCategory = await TaskCategory.findOne({
        _id: categoryData.parentId,
        userId: user._id,
      });
      if (!parentCategory) {
        return { error: "Invalid parent category" };
      }
    }

    // Create category
    const category = await TaskCategory.create({
      ...categoryData,
      name: trimName(categoryData.name),
      userId: user._id,
      color: categoryData.color || "#000000", // Default color
    });

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
  categoryId: ObjectId,
  categoryData: CategoryFormData
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!categoryId) {
      return { error: "Category ID is required." };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing category with the same name
    const isExisting = await TaskCategory.findOne({
      name: trimName(categoryData.name),
      userId: user._id,
    });

    if (isExisting && isExisting._id != categoryId) {
      return { error: "Category with this name already exists." };
    }

    // Validate parentId if provided
    if (categoryData.parentId) {
      const parentCategory = await TaskCategory.findOne({
        _id: categoryData.parentId,
        userId: user._id,
      });
      if (!parentCategory) {
        return { error: "Invalid parent category" };
      }
      // Prevent self-referencing
      if (categoryData.parentId.toString() === categoryId.toString()) {
        return { error: "Category cannot be its own parent" };
      }
    }

    // Update category
    const category = await TaskCategory.findByIdAndUpdate(
      categoryId,
      {
        ...categoryData,
        name: trimName(categoryData.name),
        color: categoryData.color || "#000000",
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return { error: "Category not found!" };
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
  categoryId: ObjectId,
  deleteTasks: boolean = false
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!categoryId) {
      return { error: "Category ID is required." };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Helper to recursively collect all descendant category IDs
    async function getAllDescendantCategoryIds(
      parentId: ObjectId | string
    ): Promise<string[]> {
      const children = await TaskCategory.find(
        { parentId: parentId.toString(), userId: user._id },
        "_id"
      );
      let ids: string[] = children.map((cat: TCategory) => cat._id.toString());
      for (const child of children) {
        ids = ids.concat(await getAllDescendantCategoryIds(child._id));
      }
      return ids;
    }

    // Get all descendant category IDs
    const descendantCategoryIds = await getAllDescendantCategoryIds(categoryId);
    const allCategoryIds = [categoryId.toString(), ...descendantCategoryIds];

    // Handle tasks based on deleteTasks parameter
    if (deleteTasks) {
      // Delete tasks in these categories
      await Task.deleteMany({
        categoryId: { $in: allCategoryIds },
        userId: user._id,
      });
    } else {
      // Remove categoryId from tasks in these categories
      await Task.updateMany(
        { categoryId: { $in: allCategoryIds }, userId: user._id },
        { $set: { categoryId: null } }
      );
    }

    // Delete all these categories
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
