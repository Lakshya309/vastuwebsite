import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
      .select("project_id, status, report_paid")
      .eq("id", analysisId)
      .single();

    if (analysisError || !analysisData) {
      return NextResponse.json(
        { message: "Analysis not found." },
        { status: 404 }
      );
    }

    // For non-admin users, enforce that analysis must be 'reviewed' to view results
    if (userRole !== "admin" && analysisData.status !== "reviewed") {
        return NextResponse.json(
            { message: "Analysis not yet reviewed or approved." },
            { status: 403 }
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

    // 2. Fetch boundary_normalized, north_direction, and objects from the projects table using project_id
    let projectQuery = supabaseAdmin
      .from("projects")
      .select("boundary_normalized, north_direction, project_objects(id, object_type, boundary_normalized, centroid)")
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

    const { boundary_normalized, north_direction, project_objects } = projectData;

    if (!boundary_normalized || north_direction === null || !project_objects) {
        return NextResponse.json(
            { message: "Missing required project parameters for full report analysis." },
            { status: 400 }
        );
    }

    // Call the Python service directly with retrieved parameters and objects
    const response = await fetch("http://127.0.0.1:5000/analyze_objects", {
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
            errorData = await response.json(); // Attempt to parse as JSON for detailed FastAPI errors
        } catch (jsonError) {
            errorData = await response.text(); // Fallback to text if not JSON
        }
        console.error("Python Full Report Analysis Service Error:", errorData);
        // Return the detailed error from Python service
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
