import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../lib/supabase-server-api";
import { prisma } from "../../../lib/db";
import { checkPaymentAccess } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authResult = await validateAuth(req as Request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const uid = authResult.user!.id;

  try {
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

    let allowed_to_analyze = false;
    let blocking_message = "Analysis blocked.";

    if (profile.role === "admin" || profile.role === "astrologer" || profile.role === "user") {
      allowed_to_analyze = true;
    } else {
      blocking_message = "Unsupported user role. Analysis blocked.";
    }

    if (!allowed_to_analyze) {
      return NextResponse.json({ message: blocking_message, needs_payment: true }, { status: 403 });
    }

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

    // 1. Verify user owns the project or has permission
    const projectData = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { user_id: true }
    });

    if (!projectData) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    if (profile.role !== "admin" && !(profile.role === "astrologer" && allowed_to_analyze)) {
      if (projectData.user_id !== uid) {
        return NextResponse.json(
          { message: "Project not found or you do not have permission." },
          { status: 403 }
        );
      }
    }

    // 2. Create a new analysis record
    try {
      const analysisData = await prisma.analyses.create({
        data: {
          project_id: projectId,
          status: "pending",
          analysis_type: analysisType,
          boundary_normalized: boundary_normalized as any,
          north_direction: north_direction,
          analysis_timestamp: analysisDate ? analysisDateTime?.toISOString() : null,
        }
      });

      return NextResponse.json(
        { message: "Analysis created successfully", analysisId: analysisData.id },
        { status: 201 }
      );
    } catch (analysisError: any) {
      console.error("Prisma analysis insert error:", analysisError);
      return NextResponse.json(
        { message: "Failed to create analysis", error: analysisError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error creating analysis:", error);
    return NextResponse.json(
      { message: "Failed to create analysis", error: error.message },
      { status: 500 }
    );
  }
}