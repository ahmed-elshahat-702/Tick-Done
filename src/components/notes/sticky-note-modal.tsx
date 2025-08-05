"use client";

import { createStickyNote, UpdateStickyNote } from "@/actions/stickyNotes";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { StickyNote as TStickyNote } from "@/types/notes";
import { StickyNoteFormData, stickyNoteSchema } from "@/validation/Note";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface StickyNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stickyNote?: TStickyNote | null;
}

const StickyNoteModal = ({
  open,
  onOpenChange,
  stickyNote,
}: StickyNoteModalProps) => {
  const {
    addStickyNote,
    updateStickyNote: editStickyNote,
    isHandling,
    setIsHandling,
  } = useAppStore();

  const form = useForm<StickyNoteFormData>({
    resolver: zodResolver(stickyNoteSchema),
    defaultValues: {
      title: "",
      content: "",
      textColor: "#000000",
      backgroundColor: "#FeF08A",
      tag: "",
    },
  });

  useEffect(() => {
    if (stickyNote) {
      form.reset({
        title: stickyNote.title,
        content: stickyNote.content || "",
        textColor: stickyNote.textColor || "#000000",
        backgroundColor: stickyNote.backgroundColor || "#FeF08A",
        tag: stickyNote.tag || "",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        textColor: "#000000",
        backgroundColor: "#FeF08A",
        tag: "",
      });
    }
  }, [stickyNote, form]);

  const onSubmit = async (data: StickyNoteFormData) => {
    try {
      setIsHandling(true);
      const stickyNoteData = { ...(data || []) };
      let res;
      if (stickyNote) {
        res = await UpdateStickyNote(stickyNote._id, stickyNoteData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        if (res?.success && res?.stickyNote) {
          await editStickyNote(stickyNote._id, res.stickyNote);
          toast.success(res.success);
        }
      } else {
        res = await createStickyNote(stickyNoteData);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        if (res?.success && res?.stickyNote) {
          addStickyNote(res.stickyNote);
          toast.success(res.success);
        }
        form.reset({
          title: "",
          content: "",
          textColor: "#000000",
          backgroundColor: "#FeF08A",
          tag: "",
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setIsHandling(false);
    }
  };

  const handleClose = () => {
    if (!isHandling) {
      form.reset({
        title: stickyNote?.title || "",
        content: stickyNote?.content || "",
        textColor: stickyNote?.textColor || "#000000",
        backgroundColor: stickyNote?.backgroundColor || "#FeF08A",
        tag: stickyNote?.tag || "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stickyNote ? "Edit Sticky Note" : "Add New Sticky Note"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter sticky note title..."
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter sticky note content..."
                      className="resize-none"
                      rows={3}
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="textColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="h-9 w-12 p-0 border-none"
                        {...field}
                        aria-label="Select sticky note text color"
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="h-9 w-12 p-0 border-none"
                        {...field}
                        aria-label="Select sticky note color"
                      />
                      <span className="text-sm text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tag (optional)..."
                      disabled={isHandling}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isHandling}
                className="w-full sm:w-auto bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isHandling}
                className="w-full sm:w-auto"
              >
                {isHandling ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    {stickyNote ? "Updating..." : "Adding..."}
                  </>
                ) : stickyNote ? (
                  "Update Sticky Note"
                ) : (
                  "Add Sticky Note"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StickyNoteModal;
