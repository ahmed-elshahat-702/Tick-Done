import { ObjectId } from "mongodb";

export interface TUser {
  _id: ObjectId;
  name: string;
  email: string;
  image?: string;
  hashedPassword: string;
  createdAt: Date;
}

export type TUserUpdate = Partial<Pick<TUser, "name" | "email" | "image">>;
