"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { TaskList } from "@/models/TaskList";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { TaskListFormData } from "@/validation/List";
import { revalidatePath } from "next/cache";
import { toPlainObject } from "@/lib/utils";
import { TList } from "@/types/list";

const trimTitle = (title: string) =>
  title
    .replace(/^\s+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export async function getTaskLists() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    const taskLists = await TaskList.find({ userId: user._id }).lean();

    const isAllTasksExists = taskLists.find((list) => list.name === "My Tasks");
    if (!isAllTasksExists) {
      await TaskList.create({
        name: "My Tasks",
        userId: user._id,
        description: "",
        color: "#000000",
      });
    }
    return {
      success: "Task lists fetched successfully!",
      taskLists: taskLists.map((list) => toPlainObject<TList>(list)),
    };
  } catch (error) {
    console.error("Failed to fetch task lists:", error);
    return { error: "Failed to fetch task lists" };
  }
}

export async function createTaskList(listData: TaskListFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    const isExisting = await TaskList.findOne({
      title: trimTitle(listData.name),
      userId: user._id,
    });
    if (isExisting)
      return { error: "Task list with this title already exists." };

    const taskList = await TaskList.create({
      ...listData,
      title: trimTitle(listData.name),
      userId: user._id,
      color: listData.color || "#000000",
    });

    if (listData.taskIds && listData.taskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: listData.taskIds }, userId: user._id },
        { $set: { listId: taskList._id } }
      );
    }

    revalidatePath("/");
    return {
      success: "Task list created successfully!",
      taskList: toPlainObject<TList>(taskList),
    };
  } catch (error) {
    console.error("Failed to create task list:", error);
    return { error: "Failed to create task list" };
  }
}

export async function updateTaskList(
  listId: string,
  listData: TaskListFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!listId) return { error: "Task list ID is required." };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    const isExisting = await TaskList.findOne({
      title: trimTitle(listData.name),
      userId: user._id,
    });
    if (isExisting && isExisting._id.toString() !== listId)
      return { error: "Task list with this title already exists." };

    const taskList = await TaskList.findByIdAndUpdate(
      listId,
      {
        ...listData,
        title: trimTitle(listData.name),
        color: listData.color || "#000000",
      },
      { new: true, runValidators: true }
    );

    if (!taskList) return { error: "Task list not found." };

    // Reset all old tasks
    const AllTasksList = await TaskList.findOne({ name: "My Tasks" });
    await Task.updateMany(
      { listId, userId: user._id },
      { $set: { listId: AllTasksList._id } }
    );

    // Assign new tasks
    if (listData.taskIds && listData.taskIds.length > 0) {
      await Task.updateMany(
        { _id: { $in: listData.taskIds }, userId: user._id },
        { $set: { listId: taskList._id } }
      );
    }

    revalidatePath("/");
    return {
      success: "Task list updated successfully!",
      taskList: toPlainObject<TList>(taskList),
    };
  } catch (error) {
    console.error("Failed to update task list:", error);
    return { error: "Failed to update task list" };
  }
}

export async function deleteTaskList(listId: string, deleteTasks = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    if (!listId) return { error: "Task list ID is required." };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (deleteTasks) {
      await Task.deleteMany({ listId, userId: user._id });
    } else {
      const AllTasksList = await TaskList.findOne({ name: "My Tasks" });
      await Task.updateMany(
        { listId, userId: user._id },
        { $set: { listId: AllTasksList._id } }
      );
    }

    await TaskList.findByIdAndDelete(listId);

    revalidatePath("/");
    return { success: "Task list deleted successfully!" };
  } catch (error) {
    console.error("Failed to delete task list:", error);
    return { error: "Failed to delete task list" };
  }
}
