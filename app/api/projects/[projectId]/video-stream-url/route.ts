import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * POST /api/projects/[projectId]/video-stream-url
 *
 * Given an R2 key (room video or project video), returns a short-lived
 * presigned GET URL so the browser can stream it directly from R2.
 *
 * Body: { r2Key: string }
 * Response: { url: string, expiresIn: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json(
      { message: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const uid = authResult.user.id;

  let body: { r2Key?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { r2Key } = body;
  if (!r2Key || typeof r2Key !== "string" || !r2Key.startsWith("videos/")) {
    return NextResponse.json({ message: "Invalid r2Key" }, { status: 400 });
  }

  // Validate ownership: key must belong to this user
  const expectedPrefix = `videos/${uid}/`;
  if (!r2Key.startsWith(expectedPrefix)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key });
    // 2-hour presigned GET URL (enough for a full watchthrough session)
    const url = await getSignedUrl(r2Client, command, { expiresIn: 7200 });

    return NextResponse.json({ url, expiresIn: 7200 }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to generate video stream URL:", error);
    return NextResponse.json(
      { message: "Failed to generate video URL", error: error.message },
      { status: 500 }
    );
  }
}
