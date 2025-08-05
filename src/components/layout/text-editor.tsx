"use client";

import { SerializedEditorState } from "lexical";
import { Editor } from "../blocks/editor-x/editor";

interface TextEditorProps {
  content: SerializedEditorState;
  setContent: (value: SerializedEditorState) => void;
}

export default function TextEditor({ content, setContent }: TextEditorProps) {
  return (
    <Editor
      editorSerializedState={content}
      onSerializedChange={(value) => setContent(value)}
    />
  );
}
