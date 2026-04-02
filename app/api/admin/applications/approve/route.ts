import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";

async function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    code = 'ASTRO-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await prisma.profiles.findUnique({
      where: { unique_code: code }
    });
    if (!existing) isUnique = true;
  }
  return code;
}

export async function POST(req: NextRequest) {
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

    const { applicationId } = await req.json();
    if (!applicationId) {
       return NextResponse.json({ message: "Application ID required" }, { status: 400 });
    }

    // 1. Verify admin role
    const adminProfile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 2. Fetch application
    const application = await prisma.astrologer_applications.findUnique({
      where: { id: applicationId },
      include: { profiles: true }
    });

    if (!application || application.status !== "PENDING") {
      return NextResponse.json({ message: "Application not found or already processed" }, { status: 404 });
    }

    // 3. Generate unique code
    const uniqueCode = await generateUniqueCode();

    // 4. Update profile and application in a transaction
    await prisma.$transaction([
      prisma.profiles.update({
        where: { id: application.user_id },
        data: {
          role: "astrologer",
          unique_code: uniqueCode,
          valid_from: new Date(),
          // Defaulting to 1 year for new astrologers, can be adjusted manually
          valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.astrologer_applications.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewed_at: new Date()
        }
      })
    ]);

    return NextResponse.json({ message: "Application approved successfully", uniqueCode }, { status: 200 });
  } catch (error: any) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { message: "Failed to approve application", error: error.message },
      { status: 500 }
    );
  }
}
