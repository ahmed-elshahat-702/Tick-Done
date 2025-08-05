"use client";

import { deleteNote } from "@/actions/notes";
import ReadOnlyEditor from "@/components/notes/read-only-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { Note as TNote } from "@/types/notes";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const NoteCard = ({ note }: { note: TNote }) => {
  const router = useRouter();
  const { removeNote, isHandling, setIsHandling } = useAppStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<TNote | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleOpenDeleteDialog = (note: TNote) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsHandling(true);
      const res = await deleteNote(note._id);
      if (res?.error) toast(res.error);
      removeNote(note._id);
      toast(res?.success);
    } catch (error) {
      toast("Failed to delete note. Please try again.");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="w-full h-full flex flex-col justify-between p-4 bg-background rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => {
          if (!isDragging) {
            router.push(`/notes/${note._id}`);
          }
        }}
      >
        <div className="h-full w-full flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold truncate">{note.title}</h3>
            <div className="flex items-center space-x-1">
              <button
                {...listeners}
                {...attributes}
                className="cursor-grab touch-none"
              >
                <GripVertical className="h-4 w-4 text-gray-600" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isHandling}
                  >
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleOpenDeleteDialog(note)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="h-full flex-1 text-sm text-muted-foreground">
            <ReadOnlyEditor content={note.content} />
          </div>
        </div>
      </div>
      {noteToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold text-destructive truncate max-w-[90%]">
                Delete:{" "}
                <span className="truncate max-w-40 md:max-w-60">
                  {noteToDelete.title || "Untitled Note"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                Are you sure you want to delete this note?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isHandling}
                className="w-full sm:w-auto"
              >
                Delete Note
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isHandling}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default NoteCard;
