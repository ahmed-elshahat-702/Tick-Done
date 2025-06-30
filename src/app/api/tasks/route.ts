import { auth } from "@/app/auth";
import connectDB from "@/lib/mongodb";
import { Task } from "@/models/Task";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const tasks = await Task.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[TASK_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
