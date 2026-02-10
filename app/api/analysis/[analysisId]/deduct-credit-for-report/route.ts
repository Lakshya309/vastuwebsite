import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: { analysisId: string };
};

export async function POST(req: NextRequest, context: RouteContext) {
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

    const { analysisId } = context.params;
    console.log(`[deduct-credit-for-report] Received analysisId: '${analysisId}'`);

    if (!analysisId) {
        console.error("[deduct-credit-for-report] Analysis ID is missing.");
        return NextResponse.json({ message: "Analysis ID is required." }, { status: 400 });
    }

    // Fetch user profile to check role
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
    const userRole = profile.role;
    const validFrom = profile.valid_from ? new Date(profile.valid_from) : null;
    const validTo = profile.valid_to ? new Date(profile.valid_to) : null;
    const currentDate = new Date();

    let isAstrologerSubscriptionActive = false;
    if (userRole === "astrologer" && validFrom && validTo) {
        if (currentDate >= validFrom && currentDate <= validTo) {
            isAstrologerSubscriptionActive = true;
        }
    }

    // Admins and Astrologers with active subscriptions do not deduct credits for report view
    if (userRole === "admin" || isAstrologerSubscriptionActive) {
        console.log(`[deduct-credit-for-report] Admin/Active Astrologer path for analysisId: ${analysisId}`);
        const { data: analysisData, error: analysisError } = await supabaseAdmin
            .from("analyses")
            .select("id, status")
            .eq("id", analysisId)
            .single();

        console.log(`[deduct-credit-for-report] Admin/Active Astrologer query result: analysisData = ${JSON.stringify(analysisData)}, analysisError = ${JSON.stringify(analysisError)}`);

        if (analysisError || !analysisData) {
            console.error(`[deduct-credit-for-report] Analysis not found for admin/active astrologer: ${analysisId}, Error: ${analysisError?.message}`);
            return NextResponse.json({ message: "Analysis not found." }, { status: 404 });
        }
        if (analysisData.status === "failed") {
            return NextResponse.json({ message: "Analysis has failed and cannot be viewed." }, { status: 403 });
        }

        // Set report_paid to true for admin/astrologer implicitly
        await supabaseAdmin
            .from("analyses")
            .update({ report_paid: true })
            .eq("id", analysisId);

        return NextResponse.json(
            { message: `Report access granted (no credit deduction for ${userRole === "admin" ? "admin" : "active astrologer subscription"}).` },
            { status: 200 }
        );
    }

    // Only 'user' role and astrologers with inactive subscriptions proceed with credit deduction
    if (userRole === "user" || (userRole === "astrologer" && !isAstrologerSubscriptionActive)) {
        console.log(`[deduct-credit-for-report] User/Inactive Astrologer path for analysisId: ${analysisId}`);
        // Check if report is already paid
        const { data: existingAnalysis, error: existingAnalysisError } = await supabaseAdmin
            .from("analyses")
            .select("id, status, report_paid, project_id")
            .eq("id", analysisId)
            .single();

        console.log(`[deduct-credit-for-report] User/Inactive Astrologer query result: existingAnalysis = ${JSON.stringify(existingAnalysis)}, existingAnalysisError = ${JSON.stringify(existingAnalysisError)}`);

        if (existingAnalysisError || !existingAnalysis) {
            console.error(`[deduct-credit-for-report] Analysis not found for user/inactive astrologer: ${analysisId}, Error: ${existingAnalysisError?.message}`);
            return NextResponse.json({ message: "Analysis not found." }, { status: 404 });
        }
        if (existingAnalysis.status === "failed") {
            return NextResponse.json({ message: "Analysis has failed and cannot be viewed." }, { status: 403 });
        }
        if (existingAnalysis.report_paid) {
            return NextResponse.json({ message: "Report already paid for." }, { status: 200 });
        }

        // Deduct credit for user
        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
            "deduct_credit",
            { p_user_id: uid }
        );

        if (deductError) {
            console.error("Supabase deduct_credit error:", deductError);
            let errorMessage = "Failed to deduct credit due to an internal error.";
            if (deductError.message.includes("insufficient credits")) {
                errorMessage = "Insufficient credits to view report. Please upgrade or contact support.";
            }
            return NextResponse.json(
                { message: errorMessage },
                { status: 403 }
            );
        }

        // If credit deducted successfully, update report_paid status
        await supabaseAdmin
            .from("analyses")
            .update({ report_paid: true })
            .eq("id", analysisId);

        return NextResponse.json(
            { message: "Credit deducted and report access granted." },
            { status: 200 }
        );
    }

    return NextResponse.json(
        { message: "Unsupported user role for this operation." },
        { status: 403 }
    );

  } catch (error: any) {
    console.error("Error deducting credit for report:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}