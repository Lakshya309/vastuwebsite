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
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin role
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const applications = await prisma.astrologer_applications.findMany({
      where: { status: "PENDING" },
      include: {
        profiles: {
          select: { email: true }
        }
      },
      orderBy: { created_at: "desc" }
    });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { message: "Failed to fetch applications", error: error.message },
      { status: 500 }
    );
  }
}
