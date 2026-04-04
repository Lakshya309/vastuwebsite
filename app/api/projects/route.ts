import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "../../../lib/supabase-server-api";
import { prisma } from "../../../lib/db";

export async function POST(req: NextRequest) {
  const authResult = await validateAuth(req as Request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
  }
  const uid = authResult.user!.id;
  const user = authResult.user!;

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
      astrologer_code
    } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    let assigned_astrologer_id = null;
    if (astrologer_code) {
      const astrologerProfile = await prisma.profiles.findUnique({
        where: { unique_code: astrologer_code }
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
        plot_side_front: plot_side_front ? parseFloat((plot_side_front as any).toString()) : null,
        plot_side_back: plot_side_back ? parseFloat((plot_side_back as any).toString()) : null,
        plot_side_left: plot_side_left ? parseFloat((plot_side_left as any).toString()) : null,
        plot_side_right: plot_side_right ? parseFloat((plot_side_right as any).toString()) : null,
        plot_diagonal: plot_diagonal ? parseFloat((plot_diagonal as any).toString()) : null,
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
  const authResult = await validateAuth(req as Request);
  if (authResult.error) {
    return NextResponse.json({ message: authResult.error }, { status: authResult.status });
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
