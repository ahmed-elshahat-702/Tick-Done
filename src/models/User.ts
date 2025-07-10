import { TUser } from "@/types/user";
import { model, models, Schema } from "mongoose";

const UserSchema: Schema = new Schema<TUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String, default: "" },
    image: { type: String, default: "" },
    hashedPassword: { type: String, required: false }, // Made optional for OAuth users
    authProvider: { type: String, required: false },
    pushSubscription: {
      type: {
        endpoint: String,
        expirationTime: { type: Number, default: null },
        keys: {
          p256dh: String,
          auth: String,
        },
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model<TUser>("User", UserSchema);
