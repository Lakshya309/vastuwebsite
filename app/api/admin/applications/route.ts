import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const user = authResult.user;

  try {

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
