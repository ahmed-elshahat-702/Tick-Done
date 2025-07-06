"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { TaskCategory } from "@/models/TaskCategory";
import { TaskFormData } from "@/validation/Task";
import { revalidatePath } from "next/cache";
import { toPlainObject } from "../lib/utils";
import { SubTask, TTask } from "@/types/task";
import { ObjectId } from "mongoose";

const trimTitle = (title: string) =>
  title
    .replace(/^\s+/, "") // Trim Leading spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with one
    .trim(); // Trim trailing spaces

export async function createTask(taskData: TaskFormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing task with the same title
    const isExisting = await Task.findOne({
      title: taskData.title,
      userId: user._id,
    });

    if (isExisting) {
      return { error: "Task with this title already exists." };
    }

    // Validate categoryId if provided
    if (taskData.categoryId) {
      const category = await TaskCategory.findOne({
        _id: taskData.categoryId,
        userId: user._id,
      });
      if (!category) {
        return { error: "Invalid category" };
      }
    }

    // Check for duplicate sub-task titles
    if (taskData.subTasks && taskData.subTasks.length > 0) {
      const subTaskTitles = taskData.subTasks.map((subTask) =>
        subTask.title.toLowerCase()
      );
      const uniqueTitles = new Set(subTaskTitles);
      if (uniqueTitles.size !== subTaskTitles.length) {
        return {
          error: "Sub-tasks must have unique titles within the same task.",
        };
      }
    }

    // Create task with sub-tasks and category
    const task = await Task.create({
      ...taskData,
      title: trimTitle(taskData.title),
      userId: user._id,
      subTasks: taskData.subTasks || [],
      categoryId: taskData.categoryId || null,
    });

    revalidatePath("/");

    return {
      success: "Task created successfully!",
      task: toPlainObject<TTask>(task),
    };
  } catch (error) {
    console.error("Failed to add new task:", error);
    return { error: "Failed to create task" };
  }
}

export async function UpdateTask(taskId: ObjectId, taskData: TaskFormData) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!taskId) {
      return { error: "Task ID is required." };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing task with the same title
    const isExisting = await Task.findOne({
      title: taskData.title,
      userId: user._id,
    });

    if (isExisting && isExisting._id != taskId) {
      return { error: "Task with this title already exists." };
    }

    // Validate categoryId if provided
    if (taskData.categoryId) {
      const category = await TaskCategory.findOne({
        _id: taskData.categoryId,
        userId: user._id,
      });
      if (!category) {
        return { error: "Invalid category" };
      }
    }

    // Check for duplicate sub-task titles
    if (taskData.subTasks && taskData.subTasks.length > 0) {
      const subTaskTitles = taskData.subTasks.map((subTask) =>
        subTask.title.toLowerCase()
      );
      const uniqueTitles = new Set(subTaskTitles);
      if (uniqueTitles.size !== subTaskTitles.length) {
        return {
          error: "Sub-tasks must have unique titles within the same task.",
        };
      }
    }

    // Update task with sub-tasks and category
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        ...taskData,
        title: trimTitle(taskData.title),
        subTasks: taskData.subTasks || [],
        categoryId: taskData.categoryId || null,
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return { error: "Task not found!" };
    }

    revalidatePath("/");

    return {
      success: "Task updated successfully!",
      task: toPlainObject<TTask>(task),
    };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "Failed to update task" };
  }
}

export async function updateTaskStatus(
  taskId: ObjectId,
  status: TTask["status"]
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!taskId) {
      return { error: "Task ID is required." };
    }

    await connectDB();
    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return { error: "Task not found!" };
    }

    revalidatePath("/");

    return {
      success: "Task updated successfully!",
      task: toPlainObject<TTask>(task),
    };
  } catch (error) {
    console.error("Failed to update task status:", error);
    return { error: "Failed to update task status" };
  }
}

export async function updateSubTaskStatus(
  taskId: ObjectId,
  subTaskId: string,
  status: "todo" | "done"
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!taskId || !subTaskId) {
      return { error: "Task ID and Sub-task ID are required." };
    }

    await connectDB();
    const task = await Task.findById(taskId);
    if (!task) {
      return { error: "Task not found!" };
    }

    // Update sub-task status
    const subTasks = task.subTasks || [];
    const subTaskIndex = subTasks.findIndex(
      (subTask: SubTask) => subTask._id.toString() === subTaskId
    );
    if (subTaskIndex === -1) {
      return { error: "Sub-task not found!" };
    }

    subTasks[subTaskIndex].status = status;
    task.subTasks = subTasks;

    await task.save({ validateBeforeSave: true });

    revalidatePath("/");

    return {
      success: "Sub-task status updated successfully!",
      task: toPlainObject<TTask>(task),
    };
  } catch (error) {
    console.error("Failed to update sub-task status:", error);
    return { error: "Failed to update sub-task status" };
  }
}

export async function deleteTask(taskId: ObjectId) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return { error: "Task not found!" };
    }

    revalidatePath("/");
    return { success: "Task deleted successfully" };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { error: "Failed to delete task" };
  }
}

export async function deleteUserTasks() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const [taskResult, categoryResult] = await Promise.all([
      Task.deleteMany({ userId: session.user.id }),
      TaskCategory.deleteMany({ userId: session.user.id }), // Delete all user categories
    ]);

    revalidatePath("/");

    return {
      success: `Deleted ${taskResult.deletedCount} tasks and ${categoryResult.deletedCount} categories for user.`,
    };
  } catch (error) {
    console.error("Failed to delete user tasks and categories:", error);
    return { error: "Failed to delete user tasks and categories" };
  }
}
