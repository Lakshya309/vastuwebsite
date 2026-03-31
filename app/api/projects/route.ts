import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { prisma } from "../../../lib/db";

export async function POST(req: NextRequest) {
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
      plot_diagonal
    } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 }
      );
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

    const projectsList = await prisma.projects.findMany({
      where: {
        user_id: user.id, // Explicitly enforce user isolation (RLS substitute)
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
