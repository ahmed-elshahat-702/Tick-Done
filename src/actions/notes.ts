"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { toPlainObject, trimTitle } from "@/lib/utils";
import { Note } from "@/models/Note";
import { User } from "@/models/User";
import { NoteFormData } from "@/validation/Note";
import { Note as TNote } from "@/types/notes";
import { revalidatePath } from "next/cache";

export async function getNotes() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    const notes = await Note.find({ userId: user._id })
      .sort({ order: 1 })
      .lean();
    return {
      success: "Notes fetched successfully!",
      notes: notes.map((note) => toPlainObject<TNote>(note)),
    };
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return { error: "Failed to fetch notes" };
  }
}

export async function getNote(noteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    const note = await Note.findOne({ _id: noteId, userId: user._id }).lean();
    if (!note) return { error: "Note not found" };

    return {
      success: "Note fetched successfully!",
      note: toPlainObject<TNote>(note),
    };
  } catch (error) {
    console.error("Failed to fetch note:", error);
    return { error: "Failed to fetch note" };
  }
}

export const createNote = async (noteData: NoteFormData) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing note with the same content
    const isExisting = await Note.findOne({
      content: noteData.content,
      userId: user._id,
    });

    if (isExisting) {
      return { error: "Note with the same content already exists." };
    }

    // Determine the next order value for the user's  notes
    const lastNote: TNote | null = await Note.findOne({
      userId: user._id,
    }).sort({ order: -1 });

    const nextOrder =
      lastNote && typeof lastNote.order === "number" ? lastNote.order + 1 : 0;

    // Create note
    const note = await Note.create({
      ...noteData,
      title: noteData.title && trimTitle(noteData.title),
      userId: user._id,
      order: nextOrder,
    });

    revalidatePath("/");

    return {
      success: "Note created successfully!",
      note: toPlainObject<TNote>(note),
    };
  } catch (error) {
    console.error("Failed to add new note:", error);
    return { error: "Failed to create note" };
  }
};

export const updateNote = async (noteId: string, noteData: NoteFormData) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    if (!noteId) {
      return { error: "Note ID is required." };
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: session.user.email });

    // Check for existing  note with the same content
    const isExisting = await Note.findOne({
      content: noteData.content,
      userId: user._id,
    });

    if (isExisting && isExisting._id != noteId) {
      return { error: "Note with this title already exists." };
    }

    // Update Note
    const note = await Note.findByIdAndUpdate(
      noteId,
      {
        ...noteData,
        title: noteData.title && trimTitle(noteData.title),
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return { error: "Note not found!" };
    }

    revalidatePath("/");

    return {
      success: "Note updated successfully!",
      note: toPlainObject<TNote>(note),
    };
  } catch (error) {
    console.error("Failed to update  note:", error);
    return { error: "Failed to update  note" };
  }
};

export async function updateNoteOrder(
  updates: { _id: string; order: number }[]
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    // Update order for each  note
    const updatePromises = updates.map(({ _id, order }) =>
      Note.findOneAndUpdate({ _id, userId: user._id }, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    revalidatePath("/");
    return { success: "Note order updated successfully" };
  } catch (error) {
    console.error("Failed to update note order:", error);
    return { error: "Failed to update note order" };
  }
}

export async function deleteNote(noteId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();

    // Find the note to get its userId and order
    const note = await Note.findById(noteId);
    if (!note) {
      return { error: "Note not found!" };
    }

    const userId = note.userId;
    const deletedOrder = note.order;

    // Delete the note
    await Note.findByIdAndDelete(noteId);

    // Decrement order for notes with order > deletedOrder
    await Note.updateMany(
      { userId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    revalidatePath("/");
    return { success: "Note deleted successfully" };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { error: "Failed to delete note" };
  }
}

export async function deleteUserNotes() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const result = await Note.deleteMany({ userId: session.user.id });

    revalidatePath("/");

    return {
      success: `Deleted ${result.deletedCount} notes for user.`,
    };
  } catch (error) {
    console.error("Failed to delete user notes:", error);
    return { error: "Failed to delete user notes." };
  }
}
