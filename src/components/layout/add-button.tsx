"use client";

import { CategoryModal } from "@/app/(tasks)/categories/category-modal";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { ListModal } from "../lists/list-modal";
import { TaskModal } from "../tasks/task-modal";
import StickyNoteModal from "../notes/sticky-note-modal";

type ModalType = "task" | "category" | "list" | "sticky-note" | null;

interface AddButtonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModal?: ModalType;
}

export function AddButton({
  open,
  onOpenChange,
  initialModal,
}: AddButtonProps) {
  const { isHandling, selectedListId, selectedCategoryId } = useAppStore();
  const [activeModal, setActiveModal] = useState<ModalType>(
    initialModal || null
  );

  // Sync activeModal with initialModal when dialog opens
  useEffect(() => {
    if (open && initialModal) {
      setActiveModal(initialModal);
    }
  }, [open, initialModal]);

  const isTaskModalOpen = activeModal === "task" && open;
  const isCategoryModalOpen = activeModal === "category" && open;
  const isListModalOpen = activeModal === "list" && open;
  const isStickyNoteModalOpen = activeModal === "sticky-note" && open;

  const handleClose = () => {
    if (!isHandling) {
      setActiveModal(null);
      onOpenChange(false);
    }
  };

  return (
    <>
      <TaskModal
        open={isTaskModalOpen}
        onOpenChange={(o) => !o && handleClose()}
        selectedListId={selectedListId}
        selectedCategoryId={selectedCategoryId}
      />

      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={(o) => !o && handleClose()}
      />

      <ListModal
        open={isListModalOpen}
        onOpenChange={(o) => !o && handleClose()}
      />
      <StickyNoteModal
        open={isStickyNoteModalOpen}
        onOpenChange={(o) => !o && handleClose()}
      />
    </>
  );
}
