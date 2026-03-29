import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ analysisId: string }> }
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

    const { analysisId } = await context.params;

    if (!analysisId) {
      console.error("[deduct-credit-for-report] Analysis ID is missing.");
      return NextResponse.json({ message: "Analysis ID is required." }, { status: 400 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true, valid_from: true, valid_to: true }
    });

    if (!profile) {
      console.error("Prisma profile fetch error: Profile not found for uid", uid);
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

    if (userRole === "admin" || isAstrologerSubscriptionActive) {
      const analysisData = await prisma.analyses.findUnique({
        where: { id: analysisId },
        select: { id: true, status: true }
      });

      if (!analysisData) {
        return NextResponse.json({ message: "Analysis not found." }, { status: 404 });
      }
      if (analysisData.status === "failed") {
        return NextResponse.json({ message: "Analysis has failed and cannot be viewed." }, { status: 403 });
      }

      await prisma.analyses.update({
        where: { id: analysisId },
        data: { report_paid: true }
      });

      return NextResponse.json(
        { message: `Report access granted (no credit deduction for ${userRole === "admin" ? "admin" : "active astrologer subscription"}).` },
        { status: 200 }
      );
    }

    if (userRole === "user" || (userRole === "astrologer" && !isAstrologerSubscriptionActive)) {
      const existingAnalysis = await prisma.analyses.findUnique({
        where: { id: analysisId },
        select: { id: true, status: true, report_paid: true, project_id: true }
      });

      if (!existingAnalysis) {
        return NextResponse.json({ message: "Analysis not found." }, { status: 404 });
      }
      if (existingAnalysis.status === "failed") {
        return NextResponse.json({ message: "Analysis has failed and cannot be viewed." }, { status: 403 });
      }
      if (existingAnalysis.report_paid) {
        return NextResponse.json({ message: "Report already paid for." }, { status: 200 });
      }

      try {
        await prisma.$executeRaw`SELECT deduct_credit(${uid}::uuid)`;
      } catch (deductError: any) {
        console.error("Prisma deduct_credit error:", deductError);
        let errorMessage = "Failed to deduct credit due to an internal error.";
        if (deductError.message && deductError.message.includes("insufficient credits")) {
          errorMessage = "Insufficient credits to view report. Please upgrade or contact support.";
        }
        return NextResponse.json(
          { message: errorMessage },
          { status: 403 }
        );
      }

      try {
        await prisma.analyses.update({
          where: { id: analysisId },
          data: { report_paid: true }
        });
      } catch (updateError: any) {
        console.error(`[deduct-credit-for-report] Failed to unlock report ${analysisId} for user ${uid}. Initiating refund.`, updateError);

        try {
          await prisma.$executeRaw`SELECT admin_adjust_user_credits(${uid}::uuid, 1)`;
          console.log(`[deduct-credit-for-report] Successfully refunded 1 credit to user ${uid}.`);
        } catch (refundError: any) {
          console.error(`[CRITICAL] Failed to refund credit for user ${uid} after report unlock error!`, refundError);
        }

        return NextResponse.json(
          { message: "Failed to unlock report due to a database error. Your credit has been restored." },
          { status: 500 }
        );
      }

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