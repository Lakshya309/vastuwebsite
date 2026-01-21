import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin"; // Import the Supabase admin client

export async function POST(req: NextRequest) {
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

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 }
      );
    }

    // Insert into Supabase 'projects' table
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({ user_id: uid, name: name })
      .select()
      .single(); // .select().single() returns the inserted row

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { message: "Failed to create project in database", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project created successfully", project: data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Failed to create project", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    // Fetch user's role from the profiles table
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", uid);

    if (profileError) {
      console.error("Supabase profile fetch error:", profileError);
      return NextResponse.json(
        { message: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    const profile = profiles?.[0];
    const role = profile?.role || "user";

    let query = supabaseAdmin.from("projects").select("*");

    // If the user is not an astrologer or dev, filter by their user_id
    if (role !== "astrologer" && role !== "dev") {
      query = query.eq("user_id", uid);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        {
          message: "Failed to fetch projects from database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Failed to fetch projects", error: error.message },
      { status: 500 }
    );
  }
}
