import { TUser } from "@/types/user";
import { model, models, Schema } from "mongoose";

const UserSchema: Schema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    hashedPassword: { type: String, required: false }, // Made optional for OAuth users
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model<TUser>("User", UserSchema);
