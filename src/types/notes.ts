import { SerializedEditorState } from "lexical";

export type Note = {
  _id: string;
  title?: string;
  content: SerializedEditorState;
  order: number;
  userId: string;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StickyNote = {
  _id: string;
  title?: string;
  content: string;
  textColor: string;
  backgroundColor: string;
  order: number;
  userId: string;
  isPinned?: boolean;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
};
