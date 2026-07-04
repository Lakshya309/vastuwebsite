import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ message: authResult.error || "Unauthorized" }, { status: 401 });
  }

  const user = authResult.user;

  try {

    let profile = await prisma.profiles.findUnique({
      where: { id: user.id }
    });

    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          id: user.id,
          email: user.email,
          role: "user"
        }
      });
    }

    // Check if there's already a pending or approved application
    const existing = await prisma.astrologer_applications.findFirst({
      where: {
        user_id: user.id,
        status: { in: ["PENDING", "APPROVED"] }
      }
    });

    if (existing) {
      return NextResponse.json(
        { message: "Application already exists or user is already approved." },
        { status: 400 }
      );
    }

    const application = await prisma.astrologer_applications.create({
      data: {
        user_id: user.id,
        status: "PENDING"
      }
    });

    return NextResponse.json({ message: "Application submitted successfully", application }, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { message: "Failed to submit application", error: error.message },
      { status: 500 }
    );
  }
}
