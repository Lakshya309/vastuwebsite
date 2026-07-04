import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string; }> }
) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
    }
    const uid = authResult.user.id;
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
