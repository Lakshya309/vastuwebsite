import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(
  req: NextRequest,
  { params }: { params: { analysisId: string } }
) {
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
    const { analysisId } = params;

    // 1. Check if the user is an astrologer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .single();

    if (
      profileError ||
      (profile?.role !== "astrologer" && profile?.role !== "dev")
    ) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    // 2. Update the analysis status
    const { data, error } = await supabaseAdmin
      .from("analyses")
      .update({ status: "reviewed" })
      .eq("id", analysisId)
      .select()
      .single();

    if (error) {
      console.error("Supabase analysis update error:", error);
      return NextResponse.json(
        { message: "Failed to approve analysis", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Analysis approved successfully", analysis: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving analysis:", error);
    return NextResponse.json(
      { message: "Failed to approve analysis", error: error.message },
      { status: 500 }
    );
  }
}
