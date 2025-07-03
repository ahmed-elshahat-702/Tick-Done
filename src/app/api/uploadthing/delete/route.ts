import { NextRequest, NextResponse } from "next/server";

// You need your UploadThing secret key
const UPLOADTHING_SECRET = process.env.UPLOADTHING_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
    }

    if (!UPLOADTHING_SECRET) {
      console.error("Please provide Secret");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Set a timeout for fetch (Node.js 18+ supports AbortController)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 seconds

    let res;
    try {
      res = await fetch("https://api.uploadthing.com/v6/deleteFiles", {
        method: "POST",
        headers: {
          "X-Uploadthing-Api-Key": UPLOADTHING_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKeys: [fileKey],
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error("Network or fetch error:", fetchError);
      return NextResponse.json(
        { error: "Network error or timeout when contacting UploadThing" },
        { status: 504 }
      );
    }
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
