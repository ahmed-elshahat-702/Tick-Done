"use client";

import { deleteStickyNote } from "@/actions/stickyNotes";
import StickyNoteModal from "@/components/notes/sticky-note-modal";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { StickyNote as TStickyNote } from "@/types/notes";
import { Edit, GripVertical, MoreHorizontal, Trash2, X } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const StickyNoteCard = ({ stickyNote }: { stickyNote: TStickyNote }) => {
  const { removeStickyNote, isHandling, setIsHandling } = useAppStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<TStickyNote | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stickyNote._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
    backgroundColor: stickyNote.backgroundColor || "#FeF08A",
  };

  const handleOpenDeleteDialog = (note: TStickyNote) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsHandling(true);
      const res = await deleteStickyNote(stickyNote._id);
      if (res?.error) toast(res.error);
      removeStickyNote(stickyNote._id);
      toast(res?.success);
    } catch (error) {
      toast("Failed to delete sticky note. Please try again.");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full h-60 flex flex-col p-4 rounded-xl shadow-md group hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <h3
          className="text-lg font-semibold mb-1 line-clamp-1 break-words"
          style={{ color: stickyNote.textColor || "#000000" }}
        >
          {stickyNote.title || "Untitled"}
        </h3>
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
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(stickyNote)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <p
          className="text-sm line-clamp-6 break-words"
          style={{ color: stickyNote.textColor || "#000000" }}
        >
          {stickyNote.content || "No content..."}
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          className="px-4 py-1 rounded-full text-xs font-medium bg-muted/40 hover:bg-muted/60 shadow transition-colors border border-muted/10"
          variant="ghost"
          onClick={() => setIsExpanded(true)}
        >
          <span className="mr-2">📝</span>
          View Full Note
        </Button>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative w-full max-w-md rounded-xl shadow-xl p-5"
            style={{ backgroundColor: stickyNote.backgroundColor || "#FeF08A" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-700 hover:text-black"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-3 break-words">
              {stickyNote.title || "Untitled"}
            </h3>
            <ScrollArea className="text-sm text-gray-900 whitespace-pre-wrap h-64 w-full break-words pr-4">
              {stickyNote.content}
            </ScrollArea>
          </div>
        </div>
      )}

      <StickyNoteModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        stickyNote={stickyNote}
      />

      {noteToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold text-destructive truncate max-w-[90%]">
                Delete:{"  "}
                <span className="truncate max-w-40 md:max-w-60">
                  {noteToDelete.title || noteToDelete.content}
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
    </div>
  );
};

export default memo(StickyNoteCard);
