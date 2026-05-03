import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/supabase-server-api";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const uid = authResult.user!.id;

  try {
    // Fetch user profile to check role
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
    const gridType = request.nextUrl.searchParams.get("gridType") || "81";

    if (!analysisId) {
      return NextResponse.json(
        { message: "analysisId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch project_id, boundary_normalized, and north_direction from the analyses table
    const analysisData = await prisma.analyses.findUnique({
      where: { id: analysisId },
      select: { project_id: true, status: true, boundary_normalized: true, north_direction: true }
    });

    if (!analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }

    const { boundary_normalized, north_direction } = analysisData;

    if (!boundary_normalized || north_direction === null) {
      return NextResponse.json(
        { message: "Missing required analysis parameters (boundary or north direction)." },
        { status: 400 }
      );
    }

    const MICROSERVICE_URL = process.env.MICROSERVICE_URL;

    // Call the Python service directly with retrieved parameters
    let response;
    try {
      response = await fetch(`${MICROSERVICE_URL}/health`);
      if (!response.ok) throw new Error("Health check failed");
    } catch (e) {
      console.error("Python service health check failed", e);
      return NextResponse.json({ error: "Python Service Unreachable" }, { status: 500 });
    }

    response = await fetch(`${MICROSERVICE_URL}/analyze`, {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary_normalized,
        north_direction,
        grid_type: gridType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text(); 
      console.error("Python Service Error:", errorData);
      return NextResponse.json({ error: "Python Service Unreachable or error during analysis" }, { status: 500 });
    }

    const data = await response.json();

    // --- Premium Filtering ---
    // Check if the project is premium
    const paidAnalysis = await prisma.analyses.findFirst({
      where: {
        project_id: analysisData.project_id,
        report_paid: true,
      },
    });

    const isPremium = !!paidAnalysis || userRole === 'admin' || userRole === 'astrologer';

    if (!isPremium) {
      // For non-premium users, lock 45 devtas (return empty array)
      data.devtas45 = [];
      // Optionally lock other things here if they are in 'data'
    }
    // -------------------------

    try {
      await prisma.analyses.update({
        where: { id: analysisId },
        data: { status: "reviewed" }
      });
    } catch (updateError: any) {
      console.error("Prisma analysis status update error:", updateError);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching devta analysis:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}