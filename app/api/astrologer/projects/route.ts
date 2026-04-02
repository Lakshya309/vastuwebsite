import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

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

    // Verify if the user has the 'astrologer' role
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true, unique_code: true, email: true }
    });

    if (!profile || profile.role !== 'astrologer') {
      return NextResponse.json(
        { message: "Forbidden: Astrologer role required" },
        { status: 403 }
      );
    }

    // Fetch projects assigned to this astrologer
    const projects = await prisma.projects.findMany({
      where: {
        assigned_astrologer_id: user.id,
        deleted_at: null,
      },
      include: {
        profiles: {
          select: {
            email: true
          }
        },
        map_plots_map_plots_project_idToprojects: {
          where: { is_active: true },
          select: { storage_path: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ projects, astrologer: profile }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching astrologer projects:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects", error: error.message },
      { status: 500 }
    );
  }
}
