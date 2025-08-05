import { clsx, type ClassValue } from "clsx";
import { SerializedEditorState, SerializedLexicalNode } from "lexical";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toPlainObject = <T>(doc: unknown): T =>
  JSON.parse(JSON.stringify(doc));

export const trimTitle = (title: string) =>
  title
    .replace(/^\s+/, "") // Trim Leading spaces
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with one
    .trim(); // Trim trailing spaces

export const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

export function extractTextFromEditorState(
  rawState: string | SerializedEditorState
): string {
  // If the input is a string (like from your DB), parse it first
  const state: SerializedEditorState =
    typeof rawState === "string" ? JSON.parse(rawState) : rawState;

  if (!state?.root?.children) return "";

  const texts: string[] = [];

  function traverse(node: SerializedLexicalNode) {
    if ("text" in node && typeof node.text === "string") {
      texts.push(node.text);
    }

    if ("children" in node && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  state.root.children.forEach(traverse);

  return texts.join(" ").replace(/\s+/g, " ").trim();
}

// export function renderLexicalStateAsHTML(
//   rawState: string | SerializedEditorState
// ): string {
//   try {
//     // Handle empty or invalid states
//     if (!rawState) return "";

//     const parsedState =
//       typeof rawState === "string" ? JSON.parse(rawState) : rawState;

//     // Validate the parsed state has required structure
//     if (!parsedState?.root?.children) return "";

//     const editor = createEditor({
//       nodes: [
//         ParagraphNode,
//         TextNode,
//         HeadingNode,
//         QuoteNode,
//         HashtagNode,
//         ListNode,
//         ListItemNode,
//       ],
//     });

//     let html = "";

//     editor.update(() => {
//       const editorState = editor.parseEditorState(parsedState);
//       editor.setEditorState(editorState);
//       html = $generateHtmlFromNodes(editor, null);
//     });

//     return html;
//   } catch (error) {
//     console.error("Error rendering Lexical state:", error);
//     return "";
//   }
// }
