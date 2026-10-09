import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/projects/[projectId]/video-notify
 *
 * Called by the mobile client after a successful direct R2 upload.
 * Updates the project's video_path in the database (project-level video)
 * OR saves a room-level video path inside metadata.mobile_map.rooms[].videoR2Key.
 *
 * Body:
 *   { r2Key: string }                     — project-level video
 *   { r2Key: string, roomId: string }     — per-room video
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

  let body: { r2Key?: string; roomId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { r2Key, roomId } = body;
  if (!r2Key || typeof r2Key !== "string" || !r2Key.startsWith("videos/")) {
    return NextResponse.json(
      { message: "Invalid or missing r2Key" },
      { status: 400 }
    );
  }

  // Security: ensure the r2Key belongs to this user's namespace
  const expectedPrefix = `videos/${uid}/`;
  if (!r2Key.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { message: "Forbidden: r2Key does not belong to this user" },
      { status: 403 }
    );
  }

  try {
    // Verify project ownership
    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true },
    });
    const isAdminOrAstrologer =
      profile?.role === "admin" || profile?.role === "astrologer";

    const project = await prisma.projects.findFirst({
      where: isAdminOrAstrologer
        ? { id: projectId }
        : { id: projectId, user_id: uid },
      select: { id: true, metadata: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // ── Per-room video path ──────────────────────────────────────────────────
    if (roomId) {
      const existingMetadata = (project.metadata as any) || {};
      const mobileMap = existingMetadata.mobile_map || {};
      const rooms: any[] = mobileMap.rooms || [];

      const updatedRooms = rooms.map((room: any) => {
        if (room.id === roomId) {
          return { ...room, videoR2Key: r2Key };
        }
        return room;
      });

      const updatedMetadata = {
        ...existingMetadata,
        mobile_map: {
          ...mobileMap,
          rooms: updatedRooms,
        },
      };

      const updatedProject = await prisma.projects.update({
        where: { id: projectId },
        data: { metadata: updatedMetadata },
      });

      return NextResponse.json(
        { message: "Room video path updated successfully", project: updatedProject },
        { status: 200 }
      );
    }

    // ── Project-level video path ─────────────────────────────────────────────
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: { video_path: r2Key },
    });

    return NextResponse.json(
      { message: "Video path updated successfully", project: updatedProject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update video_path:", error);
    return NextResponse.json(
      { message: "Failed to update project", error: error.message },
      { status: 500 }
    );
  }
}
