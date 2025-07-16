"use client";

import { CategoryModal } from "@/app/categories/category-modal";
import { useTaskStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { ListModal } from "./lists/list-modal";
import { TaskModal } from "./tasks/task-modal";

type ModalType = "task" | "category" | "list" | null;

interface AddBothProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModal?: ModalType;
}

export function AddBoth({ open, onOpenChange, initialModal }: AddBothProps) {
  const { isHandling } = useTaskStore();
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
      />

      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={(o) => !o && handleClose()}
      />

      <ListModal
        open={isListModalOpen}
        onOpenChange={(o) => !o && handleClose()}
      />
    </>
  );
}
