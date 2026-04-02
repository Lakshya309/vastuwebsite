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

    const application = await prisma.astrologer_applications.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ application }, { status: 200 });
  } catch (error: any) {
    console.error("Error checking application status:", error);
    return NextResponse.json(
      { message: "Failed to check status", error: error.message },
      { status: 500 }
    );
  }
}
