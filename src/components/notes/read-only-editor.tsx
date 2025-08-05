"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getRoot, $parseSerializedNode, SerializedEditorState } from "lexical";
import { nodes } from "../blocks/editor-x/nodes";
import { ScrollArea } from "../ui/scroll-area";

interface ReadOnlyEditorProps {
  content: SerializedEditorState;
}

const ReadOnlyEditor = ({ content }: ReadOnlyEditorProps) => {
  const initialConfig = {
    namespace: "ReadOnlyEditor",
    onError: (error: Error) => console.error(error),
    nodes: nodes,
    editorState: () => {
      const root = $getRoot();
      root.clear(); // Clear existing content
      content.root.children.forEach((node) => {
        const parsedNode = $parseSerializedNode(node);
        root.append(parsedNode);
      });
    },
    editable: false,
  };
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ScrollArea className="editor-container border rounded-md p-4 h-full max-h-40">
        <RichTextPlugin
          contentEditable={<ContentEditable className="outline-none h-full" />}
          placeholder={<div className="hidden">Enter text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </ScrollArea>
    </LexicalComposer>
  );
};

export default ReadOnlyEditor;
