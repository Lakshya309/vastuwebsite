import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase"; // Assuming createServerSupabaseClient is available for server-side
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // Assuming supabaseAdmin is available

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(); // Use for auth, if needed

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
      .select("project_id, status") // Also fetch status to ensure it's approved
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }

    // For non-admin users, we do not enforce that analysis must be 'reviewed' to view results.
    // They can view analysis once it's processed (status updated from pending)
    // Admins can always view any analysis.

    const projectId = analysisData.project_id;

    // 2. Fetch boundary_normalized and north_direction from the projects table using project_id
    let projectQuery = supabaseAdmin
      .from("projects")
      .select("boundary_normalized, north_direction")
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

    const { boundary_normalized, north_direction } = projectData;

    if (!boundary_normalized || north_direction === null) {
        return NextResponse.json(
            { message: "Missing required project parameters for analysis." },
            { status: 400 }
        );
    }

    // Call the Python service directly with retrieved parameters
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST", // The Python service still expects a POST with body
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boundary_normalized,
        north_direction,
      }),
    });

    if (!response.ok) {
        const errorData = await response.text(); // Get text for better error logging
        console.error("Python Service Error:", errorData);
        return NextResponse.json({ error: "Python Service Unreachable or error during analysis" }, { status: 500 });
    }

    const data = await response.json();

    // After successful analysis from Python service, update the status in the analyses table
    const { error: updateError } = await supabaseAdmin
        .from("analyses")
        .update({ status: "reviewed" })
        .eq("id", analysisId);

    if (updateError) {
        console.error("Supabase analysis status update error:", updateError);
        // Optionally, handle this error more gracefully, but for now, we proceed to return the analysis data
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching devta analysis:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}