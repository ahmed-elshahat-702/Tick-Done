// app/api/user/route.ts
import { NextResponse } from "next/server";
import { User } from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { auth } from "@/app/auth";

export async function PATCH(req: Request) {
  await dbConnect();
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, image, bio } = await req.json();
  const updated = await User.findOneAndUpdate(
    { email: session.user.email },
    { name, image, bio },
    { new: true }
  );
  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  await dbConnect();
  const session = await auth();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await User.findOneAndDelete({ email: session.user.email });
  return NextResponse.json({ message: "Account deleted" });
}
