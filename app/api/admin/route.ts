import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { prisma } from "../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can perform this action." },
        { status: 403 }
      );
    }

    const { action, userId, newRole, amount, validFrom, validTo } = await req.json();

    let result;

    switch (action) {
      case "updateRole":
        if (!userId || !newRole) {
          return NextResponse.json(
            { message: "userId and newRole required." },
            { status: 400 }
          );
        }
        await prisma.$executeRaw`SELECT admin_update_user_role(${userId}::uuid, ${newRole})`;
        break;

      case "adjustCredits":
        if (!userId || amount === undefined) {
          return NextResponse.json(
            { message: "userId and amount required." },
            { status: 400 }
          );
        }
        await prisma.$executeRaw`SELECT admin_adjust_user_credits(${userId}::uuid, ${amount})`;
        break;

      case "updateAstrologerAccess":
        if (!userId || !validFrom || !validTo) {
          return NextResponse.json(
            { message: "userId, validFrom and validTo required." },
            { status: 400 }
          );
        }
        await prisma.$executeRaw`SELECT admin_update_astrologer_access(${userId}::uuid, ${validFrom}::timestamp, ${validTo}::timestamp)`;
        break;

      default:
        return NextResponse.json(
          { message: "Invalid admin action." },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        message: `Admin action '${action}' completed successfully.`,
        result: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in admin API route:", err);

    return NextResponse.json(
      {
        message: "Failed to perform admin action",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
