import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string; }> }
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
    const { analysisId } = await params;

    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (!profile || (profile.role !== "astrologer" && profile.role !== "dev")) {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    try {
      const data = await prisma.analyses.update({
        where: { id: analysisId },
        data: { status: "reviewed" }
      });

      return NextResponse.json(
        { message: "Analysis approved successfully", analysis: data },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Prisma analysis update error:", error);
      return NextResponse.json(
        { message: "Failed to approve analysis", error: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error approving analysis:", error);
    return NextResponse.json(
      { message: "Failed to approve analysis", error: error.message },
      { status: 500 }
    );
  }
}
