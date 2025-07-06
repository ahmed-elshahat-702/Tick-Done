import { ObjectId } from "mongoose";

export interface TCategory {
  _id: ObjectId;
  name: string;
  userId: string;
  parentId?: string | null;
  color?: string;
}
