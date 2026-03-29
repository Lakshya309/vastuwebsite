import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { duration_days } = await request.json();

    if (!duration_days || duration_days <= 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    const newKey = `ASTRO-${uuidv4().toUpperCase()}`;

    const data = await prisma.astrologer_keys.create({
      data: {
        key: newKey,
        duration_days,
      }
    });

    return NextResponse.json({ key: data.key });

  } catch (err: any) {
    console.error("Generate key error:", err);

    return NextResponse.json(
      { error: "Failed to generate key" },
      { status: 500 }
    );
  }
}
