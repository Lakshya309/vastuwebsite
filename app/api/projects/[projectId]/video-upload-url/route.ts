import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * POST /api/projects/[projectId]/video-upload-url
 *
 * Returns a short-lived presigned PUT URL that the mobile client can use
 * to upload a video file *directly* to Cloudflare R2, bypassing the
 * Next.js/Vercel server body-size limit entirely.
 *
 * Body: { filename: string, contentType?: string }
 * Response: { uploadUrl: string, r2Key: string, expiresIn: number }
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

  const { projectId } = await params;
  const uid = authResult.user.id;

  // Verify the project belongs to this user (or user is admin/astrologer)
  const profile = await prisma.profiles.findUnique({
    where: { id: uid },
    select: { role: true },
  });

  const isAdminOrAstrologer =
    profile?.role === "admin" || profile?.role === "astrologer";

  if (!isAdminOrAstrologer) {
    const project = await prisma.projects.findFirst({
      where: { id: projectId, user_id: uid },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or access denied" },
        { status: 404 }
      );
    }
  }

  let body: { filename?: string; contentType?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Default to generic video name if no body
  }

  const filename = body.filename ?? `video_${Date.now()}.mp4`;
  const contentType = body.contentType ?? "video/mp4";

  // Build a unique R2 key
  const r2Key = `videos/${uid}/${projectId}/${Date.now()}_${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      ContentType: contentType,
    });

    // Presigned URL valid for 15 minutes — plenty for a mobile upload
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    return NextResponse.json(
      {
        uploadUrl,
        r2Key,
        expiresIn: 900,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to generate presigned R2 URL:", error);
    return NextResponse.json(
      { message: "Failed to generate upload URL", error: error.message },
      { status: 500 }
    );
  }
}
