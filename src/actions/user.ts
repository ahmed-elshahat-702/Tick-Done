"use server";

import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { User } from "@/models/User";
import { compare, hash } from "bcryptjs";

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    const session = await auth();

    if (!session || !session?.user?.email) {
      return { error: "Unauthorized" };
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return { error: "User not found" };
    }

    const isMatch = await compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return { error: "Current Password is incorrect" };
    }

    const hashedNewPassword = await hash(newPassword, 10);

    user.hashedPassword = hashedNewPassword;
    await user.save();

    return {
      success:
        "Password changes successfully!, You will redirected to sign in.",
    };
  } catch (error) {
    console.error("Failed to change password:", error);
  }
}
