import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/auth";
import { POSTER_MAX_BYTES, POSTER_TYPES } from "@/lib/poster";

// Issues the short-lived token that lets a signed-in staff browser upload a poster straight to storage.
// The file goes directly from the browser because phone PNGs can exceed Vercel's 4.5 MB request limit.
// There's deliberately no completion callback: the saved URL comes from the staff form instead.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isSignedIn())) throw new Error("Not signed in.");
        return { allowedContentTypes: POSTER_TYPES, maximumSizeInBytes: POSTER_MAX_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
