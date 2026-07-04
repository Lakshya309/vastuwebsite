import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ user: null });
  }

  const userId = (session.user as any).id;

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        valid_from: true,
        valid_to: true,
      }
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: userId },
      select: { credits: true }
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: session.user.email,
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
