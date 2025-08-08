"use client";

import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { useAppStore } from "@/lib/store";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import NoteCard from "./note-card";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { debounce } from "lodash";
import { updateNoteOrder } from "@/actions/notes";
import { restrictToParentElement } from "@dnd-kit/modifiers";

const NotesView = () => {
  const { isLoading, error, notes, setNotes } = useAppStore();
  useEffect(() => {
    if (error) {
      toast(error);
      console.error("Error loading notes:", error);
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
            const res = await updateNoteOrder(updates);
            if (res.error) throw new Error(res.error);
          } catch (error) {
            toast("Failed to update note order.");
            console.error("Error updating order:", error);
            setNotes(notes);
          }
        },
        500
      );
      await debouncedFn(updates);
    },
    [notes, setNotes]
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = notes.findIndex((note) => note._id === active.id);
        const newIndex = notes.findIndex((note) => note._id === over?.id);

        const reorderedNotes = arrayMove(notes, oldIndex, newIndex).map(
          (note, index) => ({
            ...note,
            order: index,
          })
        );

        setNotes(reorderedNotes);

        const updates = reorderedNotes.map((note, index) => ({
          _id: note._id,
          order: index,
        }));
        debouncedUpdateOrder(updates);
      }
    },
    [notes, setNotes, debouncedUpdateOrder]
  );

  const memoizedNotes = useMemo(() => notes, [notes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notes</h2>
          <p className="text-muted-foreground">
            {notes.length}
            {notes.length === 1 ? " note" : " notes"}
          </p>
        </div>
      </div>
      {notes.length === 0 ? (
        <p className="text-muted-foreground w-full">
          There are no notes yet, add your first one.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext
            items={memoizedNotes.map((note) => note._id)}
            strategy={rectSortingStrategy}
          >
            <div className="w-full h-full rounded-lg grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 bg-muted/80 dark:bg-muted/40 p-4 grid-flow-row-dense [grid-auto-rows:15rem]">
              {memoizedNotes.map((note) => (
                <NoteCard key={note._id} note={note} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default NotesView;
