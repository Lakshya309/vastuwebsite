import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "../../../lib/db";
import { feasibleDiagonalInterval } from "../../../lib/plotGeometry";

export async function POST(req: NextRequest) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }
  const uid = authResult.user.id;
  const user = authResult.user;

  try {
    let profile = await prisma.profiles.findUnique({
      where: { id: uid }
    });

    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          id: uid,
          email: user.email,
          role: "user"
        }
      });

      await prisma.user_credits.upsert({
        where: { user_id: uid },
        update: {},
        create: { user_id: uid, credits: 0 }
      });
    }

    const {
      name,
      creator_name,
      report_for,
      plot_width,
      plot_height,
      plot_side_front,
      plot_side_back,
      plot_side_left,
      plot_side_right,
      plot_diagonal,
      astrologer_code,
      expert_code
    } = await req.json();

    const expertCode = astrologer_code || expert_code;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Server-side validation for irregular plots
    const a = plot_side_front ? parseFloat(plot_side_front.toString()) : null;
    const b = plot_side_back ? parseFloat(plot_side_back.toString()) : null;
    const c = plot_side_left ? parseFloat(plot_side_left.toString()) : null;
    const d = plot_side_right ? parseFloat(plot_side_right.toString()) : null;
    const e = plot_diagonal ? parseFloat(plot_diagonal.toString()) : null;

    if (a && b && c && d) {
      if (a <= 0 || b <= 0 || c <= 0 || d <= 0) {
        return NextResponse.json(
          { message: "All sides must be positive numbers" },
          { status: 400 }
        );
      }

      const interval = feasibleDiagonalInterval(a, b, c, d);
      if (!interval) {
        return NextResponse.json(
          {
            message:
              "Invalid plot: these four sides cannot form a quadrilateral. Adjust the side lengths.",
          },
          { status: 400 }
        );
      }
      if (e) {
        if (e <= interval.min || e >= interval.max) {
          return NextResponse.json(
            {
              message: `Invalid diagonal: must be strictly between ${interval.min.toFixed(2)} and ${interval.max.toFixed(2)} (FL–BR diagonal).`,
            },
            { status: 400 }
          );
        }
      }
    }

    let assigned_astrologer_id = null;
    if (expertCode) {
      const astrologerProfile = await prisma.profiles.findUnique({
        where: { expert_code: expertCode }
      });
      if (astrologerProfile) {
        assigned_astrologer_id = astrologerProfile.id;
      }
    }

    const newProject = await prisma.projects.create({
      data: {
        user_id: uid,
        name: name,
        creator_name: creator_name,
        report_for: report_for,
        plot_width: plot_width ? parseFloat((plot_width as any).toString()) : null,
        plot_height: plot_height ? parseFloat((plot_height as any).toString()) : null,
        plot_side_front: a,
        plot_side_back: b,
        plot_side_left: c,
        plot_side_right: d,
        plot_diagonal: e,
        assigned_astrologer_id: assigned_astrologer_id
      }
    });

    return NextResponse.json(
      { message: "Project created successfully", project: newProject },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Failed to create project", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  console.log("=== DEBUG ===");
  
  const authResult = await validateAuth();
  console.log("Auth result:", authResult.error ? `Error: ${authResult.error}` : `Success: ${authResult.user?.id}`);
  
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }
  try {

    const projectsList = await prisma.projects.findMany({
      where: {
        user_id: authResult.user!.id, // Explicitly enforce user isolation (RLS substitute)
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      }
    });

    return NextResponse.json({ projects: projectsList }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects", error: error.message },
      { status: 500 }
    );
  }
}
