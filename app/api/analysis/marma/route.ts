import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../../lib/supabase-server-api";
import { prisma } from "../../../../lib/db";
import { getMarmaPoints } from "@/lib/marmaAnalysis";

export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const uid = authResult.user!.id;

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (!profile) {
      console.error("Prisma profile fetch error: Not found");
      return NextResponse.json(
        { message: "Failed to fetch user profile." },
        { status: 500 }
      );
    }
    const userRole = profile.role;

    const analysisId = request.nextUrl.searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { message: "analysisId is required" },
        { status: 400 }
      );
    }

    const analysisData = await prisma.analyses.findUnique({
      where: { id: analysisId },
      select: { project_id: true, status: true }
    });

    if (!analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }

    const projectId = analysisData.project_id;

    const projectData = await prisma.projects.findUnique({
      where: { id: projectId! },
      select: { user_id: true, boundary_normalized: true }
    });

    if (!projectData || (userRole !== "admin" && projectData.user_id !== uid)) {
      return NextResponse.json(
        { message: "Project data not found or you do not have permission." },
        { status: 404 }
      );
    }

    const { boundary_normalized } = projectData;

    if (!boundary_normalized) {
        return NextResponse.json(
            { message: "Missing required boundary for marma analysis." },
            { status: 400 }
        );
    }

    // Perform in-process marma analysis
    const marmaData = getMarmaPoints(boundary_normalized as any);

    return NextResponse.json(marmaData);
  } catch (error: any) {
    console.error("Error calculating marma points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}