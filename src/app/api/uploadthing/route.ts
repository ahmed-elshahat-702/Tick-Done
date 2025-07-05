import { auth } from "@/app/auth";
import { createRouteHandler } from "uploadthing/next";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const response = await utapi.uploadFiles(file);
    return Response.json(response.data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileKey } = await req.json();
  if (!fileKey) {
    return Response.json({ error: "File key is required" }, { status: 400 });
  }

  try {
    await utapi.deleteFiles(fileKey);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}