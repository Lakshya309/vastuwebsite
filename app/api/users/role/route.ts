import { validateAuth } from "@/lib/auth";
import { prisma } from "../../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }
  const uid = authResult.user.id;

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ role: profile.role }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/users/role:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
