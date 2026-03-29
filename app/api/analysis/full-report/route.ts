import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }
    const uid = user.id;

    // Fetch user profile to check role
    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (!profile) {
      console.error("Prisma profile fetch error: Profile not found");
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

    // 1. Fetch project_id from the analyses table using analysisId
    const analysisData = await prisma.analyses.findUnique({
      where: { id: analysisId },
      select: { project_id: true, status: true, report_paid: true }
    });

    if (!analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }

    // Enforce report_paid check for 'user' role
    if (userRole === "user" && !analysisData.report_paid) {
        return NextResponse.json(
            { message: "Report has not been paid for or accessed by this user." },
            { status: 403 }
        );
    }

    const projectId = analysisData.project_id;

    // 2. Fetch boundary_normalized, north_direction, and objects from the projects table
    const projectData = await prisma.projects.findUnique({
      where: { id: projectId! },
      select: {
        user_id: true,
        boundary_normalized: true,
        north_direction: true,
        project_objects: {
          select: {
            id: true,
            object_type: true,
            boundary_normalized: true,
            centroid: true
          }
        }
      }
    });

    if (!projectData || (userRole !== "admin" && projectData.user_id !== uid)) {
      return NextResponse.json(
        { message: "Project data not found or you do not have permission." },
        { status: 404 }
      );
    }

    const { boundary_normalized, north_direction, project_objects } = projectData;

    if (!boundary_normalized || north_direction === null || !project_objects) {
        return NextResponse.json(
            { message: "Missing required project parameters for full report analysis." },
            { status: 400 }
        );
    }

    const MICROSERVICE_URL = process.env.MICROSERVICE_URL || "http://72.61.224.232:8001";

    // Call the Python service directly with retrieved parameters and objects
    const response = await fetch(`${MICROSERVICE_URL}/analyze_objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary_normalized,
        north_direction,
        placed_objects: project_objects,
      }),
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json(); 
        } catch (jsonError) {
            errorData = await response.text(); 
        }
        console.error("Python Full Report Analysis Service Error:", errorData);
        return NextResponse.json(
            { error: "Python Full Report Analysis Service Error", details: errorData },
            { status: 500 }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching full report analysis:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
