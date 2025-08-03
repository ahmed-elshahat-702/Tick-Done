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
