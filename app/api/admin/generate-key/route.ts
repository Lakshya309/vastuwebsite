import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseClient();

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get duration
    const { duration_days } = await request.json();

    if (!duration_days || duration_days <= 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Generate key
    const newKey = `ASTRO-${uuidv4().toUpperCase()}`;

    const { data, error } = await supabase
      .from("astrologer_keys")
      .insert({
        key: newKey,
        duration_days,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ key: data.key });

  } catch (err: any) {
    console.error("Generate key error:", err);

    return NextResponse.json(
      { error: "Failed to generate key" },
      { status: 500 }
    );
  }
}
