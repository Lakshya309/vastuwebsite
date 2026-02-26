import { createServerSupabaseClient } from "../../../../lib/supabase";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();

  try {
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
    const uid = user.id;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", uid);

    if (error) {
      console.error("Supabase select role error:", error);
      return NextResponse.json(
        { message: "Failed to fetch role", error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ role: data[0].role }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/users/role:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
