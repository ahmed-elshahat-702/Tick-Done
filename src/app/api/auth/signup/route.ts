import connectDB from "@/lib/mongodb";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered. Try to signin." },
        { status: 409 }
      );
    }
    const hashedPassword = await hash(password, 10);

    const newUser = new User({
      name,
      email,
      hashedPassword,
    });

    await newUser.save();

    return NextResponse.json(
      { message: "User created", userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sign-up error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
