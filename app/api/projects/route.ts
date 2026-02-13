import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";

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

    const { name, creator_name, report_for } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required" },
        { status: 400 }
      );
    }

    // Insert into Supabase 'projects' table using the standard client
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: uid, name: name, creator_name: creator_name, report_for: report_for })
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

    // Fetch projects using the standard client. RLS policies will handle the filtering.
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

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
