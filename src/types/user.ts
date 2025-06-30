import { ObjectId } from "mongodb";

export interface TUser {
  _id?: ObjectId;
  name: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
}
