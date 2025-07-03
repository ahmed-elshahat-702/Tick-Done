import { ObjectId } from "mongodb";

export interface TUser {
  _id: ObjectId;
  name: string;
  email: string;
  image?: string;
  hashedPassword?: string; // Made optional for OAuth users
  createdAt: Date;
}

export type TUserUpdate = Partial<Pick<TUser, "name" | "email" | "image">>;
