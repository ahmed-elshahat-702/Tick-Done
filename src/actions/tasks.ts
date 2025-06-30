"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { TaskFormData } from "@/validation/Task";
import { revalidatePath } from "next/cache";
import { toPlainObject } from "../lib/utils";
import { TTask } from "@/types/task";
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
    const isExisting = await Task.findOne({ title: taskData.title });

    if (isExisting) {
      return { error: "Task with this title already exist." };
    }
    // Create task
    const task = await Task.create({
      ...taskData,
      // Trim title
      title: trimTitle(taskData.title),
      userId: user._id,
    });

    revalidatePath("/");

    return {
      success: "Task created successfully!",
      task: toPlainObject<TTask>(task),
    };
  } catch (error) {
    console.error("Failed to add new task:", error);
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

    // Check for existing task with the same title
    const isExisting = await Task.findOne({ title: taskData.title });

    if (isExisting && isExisting._id != taskId) {
      console.log(isExisting._id);
      console.log(taskId);
      return { error: "Task with this title already exist." };
    }
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        ...taskData,
        title: trimTitle(taskData.title),
      },
      { new: true }
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
      { new: true }
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
  }
}
