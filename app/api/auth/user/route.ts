import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      }
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: user.id },
      select: { credits: true }
    });

    return NextResponse.json({
      user: {
        ...user,
        profile: profile ? {
          ...profile,
          credits: userCredits?.credits ?? 0,
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
