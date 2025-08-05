"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { noteSchema } from "@/validation/Note";
import { useAppStore } from "@/lib/store";
import { Note } from "@/types/notes";
import { getNote, updateNote } from "@/actions/notes";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import TextEditor from "@/components/layout/text-editor";
import { SerializedEditorState } from "lexical";
import { useRouter } from "next/navigation";
import { initialValue } from "@/lib/utils";

export default function NotePage({ id }: { id: string }) {
  const router = useRouter();

  const { updateNote: editNote, isHandling, setIsHandling } = useAppStore();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<SerializedEditorState>(initialValue);
  const [saving, setSaving] = useState(false);

  // Get note
  useEffect(() => {
    const getNoteData = async () => {
      setIsHandling(true);
      try {
        const res = await getNote(id);
        if (res?.error) {
          toast.error("Failed to fetch note");
          return;
        }
        if (!res?.note) {
          toast.error("Note not found");
          return;
        }

        setNote(res.note);
        setTitle(res.note.title ?? "");
        setContent(
          typeof res.note.content === "string"
            ? JSON.parse(res.note.content)
            : res.note.content
        );
      } catch (error) {
        toast.error("Failed to fetch note");
        console.error("Error fetching note:", error);
      } finally {
        setIsHandling(false);
      }
    };

    getNoteData();
  }, [id, setIsHandling]);

  const handleSave = async () => {
    if (!note) return;

    const validation = noteSchema.safeParse({ title, content });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);

    const res = await updateNote(note._id, {
      title,
      content,
    });

    if (res.error) {
      toast.error("Failed to update note");
      setSaving(false);
      return;
    }

    if (!res.note) {
      toast.error("Note not found");
      setSaving(false);
      return;
    }

    toast.success("Note updated ✅");
    editNote(note._id, res.note);
    setSaving(false);
    router.push("/notes");
  };

  if (!note || isHandling) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">Loading your note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">✏️ Edit Note</h1>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/notes">Notes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{note?.title || "Untitled Note"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Input
        placeholder="Note title... (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextEditor content={content} setContent={setContent} />
      <Button
        onClick={handleSave}
        disabled={saving || !content?.root?.children?.length}
      >
        {saving ? "Saving..." : "💾 Save changes"}
      </Button>
    </div>
  );
}
