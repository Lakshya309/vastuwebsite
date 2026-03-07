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

    // 1. Fetch project_id, boundary_normalized, and north_direction from the analyses table using analysisId
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .select("project_id, status, boundary_normalized, north_direction")
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
    const { boundary_normalized, north_direction } = analysisData;

    // No need to fetch from projects table for boundary_normalized and north_direction anymore
    // as they are directly from the analyses table.

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