import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { deductCredit, checkPaymentAccess } from "@/lib/auth";

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

    const paymentAccess = await checkPaymentAccess(uid);
    
    if (profile.role === "admin" || paymentAccess.hasAccess) {
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
        { 
          message: "Report access granted.",
          no_credit_deduction: true 
        },
        { status: 200 }
      );
    }

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

    const deducted = await deductCredit(uid, 1);
    
    if (!deducted) {
      return NextResponse.json(
        { 
          message: "Insufficient credits to view report. Please purchase more credits or subscribe.",
          needs_payment: true 
        },
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
        await prisma.user_credits.upsert({
          where: { user_id: uid },
          update: { credits: { increment: 1 } },
          create: { user_id: uid, credits: 1 }
        });
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

  } catch (error: any) {
    console.error("Error deducting credit for report:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}