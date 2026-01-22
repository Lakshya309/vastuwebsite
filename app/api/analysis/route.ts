import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

interface PlacedObject {
  type: string;
  boundary_normalized: { x: number; y: number }[];
  zone: string;
}

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

    // Fetch user profile
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

    // Initialize allowed_to_analyze flag
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
      // Call the deduct_credit function via Supabase RPC
      const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
        "deduct_credit",
        { p_user_id: uid }
      );

      if (deductError) {
        console.error("Supabase deduct_credit error:", deductError);
        // Check if the error is due to insufficient credits (this depends on how the DB function reports it)
        if (deductError.message.includes("insufficient credits")) {
             blocking_message = "Insufficient credits to perform analysis. Please upgrade or contact support.";
        } else {
            blocking_message = "Failed to deduct credit due to an internal error.";
        }
      } else if (deductError && deductError.message.includes("Insufficient credits")) {
        blocking_message = "Insufficient credits to perform analysis. Please upgrade or contact support.";
      } else if (deductResult) { // If deductResult is true, then credit was deducted
        allowed_to_analyze = true;
      } else {
         // This else case might catch unexpected scenarios, log for debugging
         console.error("Unexpected deduct_credit result:", { deductResult, deductError });
         blocking_message = "An unknown error occurred during credit deduction.";
      }
    } else {
      blocking_message = "Unsupported user role. Analysis blocked.";
    }

    if (!allowed_to_analyze) {
      return NextResponse.json({ message: blocking_message }, { status: 403 });
    }

    const { projectId, objects } = await req.json();

    if (
      !projectId ||
      !objects ||
      !Array.isArray(objects) ||
      objects.length === 0
    ) {
      return NextResponse.json(
        { message: "Project ID and a list of objects are required" },
        { status: 400 }
      );
    }

    // 1. Verify user owns the project
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { message: "Project not found or you do not have permission." },
        { status: 404 }
      );
    }

    // 2. Create a new analysis record
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .insert({ project_id: projectId, status: "pending" })
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

    // 3. Format the analysis items from the placed objects
    const analysisItems = objects.map((obj: PlacedObject) => ({
      analysis_id: analysisId,
      object: obj.type,
      direction: obj.zone,
      // boundary_normalized is not part of the analysis_items schema
      source: "manual",
      confidence: 1.0, // Manual entries are 100% confident
    }));

    // 4. Insert the items into the database
    const { error: itemsError } = await supabaseAdmin
      .from("analysis_items")
      .insert(analysisItems);

    if (itemsError) {
      console.error("Supabase analysis_items insert error:", itemsError);
      // Optional: Clean up by deleting the analysis record if items fail
      await supabaseAdmin.from("analyses").delete().eq("id", analysisId);
      return NextResponse.json(
        {
          message: "Failed to save analysis items",
          error: itemsError.message,
        },
        { status: 500 }
      );
    }

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