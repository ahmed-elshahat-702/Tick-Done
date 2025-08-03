"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { toPlainObject, trimTitle } from "@/lib/utils";
import { StickyNote } from "@/models/StickyNote";
import { User } from "@/models/User";
import { StickyNoteFormData } from "@/validation/Note";
import { StickyNote as TStickyNote } from "@/types/notes";
import { revalidatePath } from "next/cache";

export async function getStickyNotes() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    const stickyNotes = await StickyNote.find({ userId: user._id })
      .sort({ order: 1 })
      .lean();
    return {
      success: "Sticky notes fetched successfully!",
      stickyNotes: stickyNotes.map((note) => toPlainObject<TStickyNote>(note)),
    };
  } catch (error) {
    console.error("Failed to fetch sticky notes:", error);
    return { error: "Failed to fetch sticky notes" };
  }
}

export const createStickyNote = async (stickyNoteData: StickyNoteFormData) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing note with the same content
    const isExisting = await StickyNote.findOne({
      content: stickyNoteData.content,
      userId: user._id,
    });

    if (isExisting) {
      return { error: "Sticky Note with the same content already exists." };
    }

    // Determine the next order value for the user's sticky notes
    const lastNote: TStickyNote | null = await StickyNote.findOne({
      userId: user._id,
    }).sort({ order: -1 });

    const nextOrder =
      lastNote && typeof lastNote.order === "number" ? lastNote.order + 1 : 0;

    // Create note
    const stickyNote = await StickyNote.create({
      ...stickyNoteData,
      title: stickyNoteData.title && trimTitle(stickyNoteData.title),
      userId: user._id,
      order: nextOrder,
    });

    revalidatePath("/");

    return {
      success: "Sticky Note created successfully!",
      stickyNote: toPlainObject<TStickyNote>(stickyNote),
    };
  } catch (error) {
    console.error("Failed to add new sticky note:", error);
    return { error: "Failed to create sticky note" };
  }
};

export const UpdateStickyNote = async (
  stickyNoteId: string,
  stickyNoteData: StickyNoteFormData
) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!stickyNoteId) {
      return { error: "Sticky Note ID is required." };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing sticky note with the same content
    const isExisting = await StickyNote.findOne({
      content: stickyNoteData.content,
      userId: user._id,
    });

    if (isExisting && isExisting._id != stickyNoteId) {
      return { error: "Sticky Note with this title already exists." };
    }

    // Update stickyNote
    const stickyNote = await StickyNote.findByIdAndUpdate(
      stickyNoteId,
      {
        ...stickyNoteData,
        title: stickyNoteData.title && trimTitle(stickyNoteData.title),
      },
      { new: true, runValidators: true }
    );

    if (!stickyNote) {
      return { error: "Sticky Note not found!" };
    }

    revalidatePath("/");

    return {
      success: "Sticky Note updated successfully!",
      stickyNote: toPlainObject<TStickyNote>(stickyNote),
    };
  } catch (error) {
    console.error("Failed to update sticky note:", error);
    return { error: "Failed to update sticky note" };
  }
};

export async function updateStickyNoteOrder(
  updates: { _id: string; order: number }[]
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    // Update order for each sticky note
    const updatePromises = updates.map(({ _id, order }) =>
      StickyNote.findOneAndUpdate(
        { _id, userId: user._id },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    revalidatePath("/");
    return { success: "Sticky note order updated successfully" };
  } catch (error) {
    console.error("Failed to update sticky note order:", error);
    return { error: "Failed to update sticky note order" };
  }
}

export async function deleteStickyNote(stickyNoteId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Find the note to get its userId and order
    const stickyNote = await StickyNote.findById(stickyNoteId);
    if (!stickyNote) {
      return { error: "Sticky Note not found!" };
    }

    const userId = stickyNote.userId;
    const deletedOrder = stickyNote.order;

    // Delete the note
    await StickyNote.findByIdAndDelete(stickyNoteId);

    // Decrement order for notes with order > deletedOrder
    await StickyNote.updateMany(
      { userId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    revalidatePath("/");
    return { success: "Sticky Note deleted successfully" };
  } catch (error) {
    console.error("Failed to delete sticky note:", error);
    return { error: "Failed to delete sticky note" };
  }
}

export async function deleteUserStickyNotes() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const result = await StickyNote.deleteMany({ userId: session.user.id });

    revalidatePath("/");

    return {
      success: `Deleted ${result.deletedCount} sticky notes for user.`,
    };
  } catch (error) {
    console.error("Failed to delete user sticky notes:", error);
    return { error: "Failed to delete user sticky notes." };
  }
}
