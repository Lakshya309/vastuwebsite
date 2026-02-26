import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { getMarmaPoints } from "@/lib/marmaAnalysis";

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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .single();

    if (profileError || !profile) {
      console.error("Supabase profile fetch error:", profileError);
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
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .select("project_id, status")
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }



    const projectId = analysisData.project_id;

    // 2. Fetch boundary_normalized from the projects table using project_id
    let projectQuery = supabaseAdmin
      .from("projects")
      .select("boundary_normalized")
      .eq("id", projectId);

    // If the user is NOT an admin, enforce ownership check
    if (userRole !== "admin") {
      projectQuery = projectQuery.eq("user_id", uid);
    }

    const { data: projectData, error: projectError } = await projectQuery.single();

    if (projectError || !projectData) {
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
    // Assuming getMarmaPoints expects the boundary in the same format as stored
    const marmaData = getMarmaPoints(boundary_normalized);

    return NextResponse.json(marmaData);
  } catch (error: any) {
    console.error("Error calculating marma points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}