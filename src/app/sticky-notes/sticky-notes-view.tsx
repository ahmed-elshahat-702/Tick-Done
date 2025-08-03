"use client";

import { useTaskStore } from "@/lib/store";
import StickyNoteCard from "./sticky-note-card";
import { useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { updateStickyNoteOrder } from "@/actions/stickyNotes";
import { debounce } from "lodash";
import { restrictToParentElement } from "@dnd-kit/modifiers";

const StickyNotesView = () => {
  const { isLoading, error, stickyNotes, setStickyNotes } = useTaskStore();

  useEffect(() => {
    if (error) {
      toast(error);
      console.error("Error loading sticky notes:", error);
    }
  }, [error]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const debouncedUpdateOrder = useCallback(
    async (updates: { _id: string; order: number }[]) => {
      const debouncedFn = debounce(
        async (updates: { _id: string; order: number }[]) => {
          try {
            const res = await updateStickyNoteOrder(updates);
            if (res.error) throw new Error(res.error);
          } catch (error) {
            toast("Failed to update note order.");
            console.error("Error updating order:", error);
            setStickyNotes(stickyNotes);
          }
        },
        500
      );
      await debouncedFn(updates);
    },
    [stickyNotes, setStickyNotes]
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = stickyNotes.findIndex(
          (note) => note._id === active.id
        );
        const newIndex = stickyNotes.findIndex((note) => note._id === over?.id);

        const reorderedNotes = arrayMove(stickyNotes, oldIndex, newIndex).map(
          (note, index) => ({
            ...note,
            order: index,
          })
        );

        setStickyNotes(reorderedNotes);

        const updates = reorderedNotes.map((note, index) => ({
          _id: note._id,
          order: index,
        }));
        debouncedUpdateOrder(updates);
      }
    },
    [stickyNotes, setStickyNotes, debouncedUpdateOrder]
  );

  const memoizedStickyNotes = useMemo(() => stickyNotes, [stickyNotes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your sticky notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sticky Notes</h2>
          <p className="text-muted-foreground">
            {stickyNotes.length}
            {stickyNotes.length === 1 ? " note" : " notes"}
          </p>
        </div>
      </div>

      {stickyNotes.length === 0 ? (
        <p className="text-muted-foreground w-full">
          There is no sticky notes yet, add your first one.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext
            items={memoizedStickyNotes.map((note) => note._id)}
            strategy={rectSortingStrategy}
          >
            <div className="w-full min-h-fit h-full rounded-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 bg-accent p-4 grid-flow-row-dense [grid-auto-rows:15rem]">
              {memoizedStickyNotes.map((note) => (
                <StickyNoteCard key={note._id} stickyNote={note} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default StickyNotesView;
