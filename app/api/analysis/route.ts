import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: NextRequest) {
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

    // Fetch user profile (existing logic)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, valid_from, valid_to")
      .eq("id", uid)
      .single();

    if (profileError || !profile) {
      console.error("Supabase profile fetch error:", profileError);
      return NextResponse.json(
        { message: "Failed to fetch user profile." },
        { status: 500 }
      );
    }

    let allowed_to_analyze = false;
    let blocking_message = "Analysis blocked.";

    if (profile.role === "astrologer") {
      const now = new Date();
      const validFrom = profile.valid_from ? new Date(profile.valid_from) : null;
      const validTo = profile.valid_to ? new Date(profile.valid_to) : null;

      if (validFrom && validTo && now >= validFrom && now <= validTo) {
        allowed_to_analyze = true;
      } else {
        blocking_message = "Astrologer access expired or not yet valid.";
      }
    } else if (profile.role === "user") {
        allowed_to_analyze = true; // Users can create analysis requests, credits deducted upon viewing report
    } else if (profile.role === "admin") {
        allowed_to_analyze = true; // Admins have unlimited analysis
    } else {
      blocking_message = "Unsupported user role. Analysis blocked.";
    }

    if (!allowed_to_analyze) {
      return NextResponse.json({ message: blocking_message }, { status: 403 });
    }

    // Extract new parameters and remove 'objects'
    const { projectId, analysisType, boundary_normalized, north_direction, analysisDate, analysisTime } = await req.json();

    if (
      !projectId ||
      !analysisType ||
      !boundary_normalized ||
      north_direction === undefined
    ) {
      return NextResponse.json(
        { message: "Project ID, analysis type, boundary, and north direction are required." },
        { status: 400 }
      );
    }

    // --- Date and Time Validation Logic ---
    let analysisDateTime: Date | null = null;
    if (analysisDate) {
        try {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(analysisDate)) {
                return NextResponse.json(
                    { message: "Invalid analysisDate format. Expected YYYY-MM-DD." },
                    { status: 400 }
                );
            }

            let dateTimeString = analysisDate;
            if (analysisTime) {
                const timeRegex = /^\d{2}:\d{2}$/;
                if (!timeRegex.test(analysisTime)) {
                    return NextResponse.json(
                        { message: "Invalid analysisTime format. Expected HH:MM." },
                        { status: 400 }
                    );
                }
                dateTimeString += `T${analysisTime}:00`;
            } else {
                dateTimeString += `T00:00:00`;
            }

            analysisDateTime = new Date(dateTimeString);
            if (isNaN(analysisDateTime.getTime())) {
                return NextResponse.json(
                    { message: "Invalid analysisDate or analysisTime combination." },
                    { status: 400 }
                );
            }

            if (analysisDateTime.getTime() > new Date().getTime()) {
                return NextResponse.json(
                    { message: "Analysis date and time cannot be in the future." },
                    { status: 400 }
                );
            }

        } catch (dateError: any) {
            console.error("Date/Time parsing error:", dateError);
            return NextResponse.json(
                { message: "Error processing analysisDate or analysisTime." },
                { status: 400 }
            );
        }
    }
    // --- End Date and Time Validation Logic ---

    // 1. Verify user owns the project or has permission (existing logic)
    let projectQuery = supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId);

    // If the user is neither an admin nor an active astrologer, restrict by user_id
    if (profile.role !== "admin" && !(profile.role === "astrologer" && allowed_to_analyze)) {
      projectQuery = projectQuery.eq("user_id", uid);
    }

    const { data: projectData, error: projectError } = await projectQuery.single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { message: "Project not found or you do not have permission." },
        { status: 404 }
      );
    }

    // 2. Create a new analysis record
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("analyses")
      // Currently, the 'analyses' table schema does not include columns for analysisType,
      // boundary_normalized, north_direction, analysisDate, or analysisTime.
      // These would need to be added to the 'analyses' table schema via a migration
      // or stored in a generic jsonb 'metadata' column if available.
      // For now, we only store project_id and status.
      .insert({
          project_id: projectId,
          status: "pending",
          analysis_type: analysisType,
          boundary_normalized: boundary_normalized,
          north_direction: north_direction,
          analysis_timestamp: analysisDate ? analysisDateTime?.toISOString() : null,
      })
      .select()
      .single();

    if (analysisError) {
      console.error("Supabase analysis insert error:", analysisError);
      return NextResponse.json(
        { message: "Failed to create analysis", error: analysisError.message },
        { status: 500 }
      );
    }

    const analysisId = analysisData.id;

    // Removed the analysis_items insertion logic as it's now handled by detailed analysis routes
    // and project_objects.

    return NextResponse.json(
      { message: "Analysis created successfully", analysisId: analysisId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating analysis:", error);
    return NextResponse.json(
      { message: "Failed to create analysis", error: error.message },
      { status: 500 }
    );
  }
}