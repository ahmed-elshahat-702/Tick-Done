import { ObjectId } from "mongodb";

export interface TUser {
  _id: ObjectId;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  hashedPassword?: string; // Made optional for OAuth users
  authProvider?: string;
  createdAt: Date;
}

export type TUserUpdate = Partial<
  Pick<TUser, "name" | "email" | "image" | "bio">
>;
