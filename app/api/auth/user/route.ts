import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/supabase-server-api";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authResult = await validateAuth(req as unknown as Request);
  
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ user: null });
  }

  const user = authResult.user;

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
