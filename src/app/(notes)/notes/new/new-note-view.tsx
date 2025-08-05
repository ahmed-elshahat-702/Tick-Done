"use client";

import { createNote } from "@/actions/notes";
import TextEditor from "@/components/layout/text-editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { initialValue } from "@/lib/utils";
import { noteSchema } from "@/validation/Note";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const NewNoteView = () => {
  const router = useRouter();
  const { addNote } = useAppStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const validation = noteSchema.safeParse({ title, content });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);

    const result = await createNote({
      title,
      content,
    });

    if (result?.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    if (result?.note) {
      toast.success("Note created successfully ✅");
      addNote(result.note);
      router.push(`/notes`);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create New Note 📝</h1>

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
            <BreadcrumbPage>New</BreadcrumbPage>
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
        disabled={saving || !content.root.children.length}
      >
        {saving ? "Saving..." : "💾 Save Note"}
      </Button>
    </div>
  );
};

export default NewNoteView;
