import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const { analysisId } = await params;

  if (!analysisId) {
    return NextResponse.json({ message: "Analysis ID is required" }, { status: 400 });
  }

  try {
    const analysis = await prisma.analyses.findUnique({
      where: { id: analysisId },
      select: { id: true, status: true },
    });

    if (!analysis) {
      return NextResponse.json({ message: "Analysis not found" }, { status: 404 });
    }

    return NextResponse.json({ status: analysis.status || "completed" }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching analysis status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
