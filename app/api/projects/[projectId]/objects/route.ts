import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const { projectId } = await params;
    console.log("projectId:", projectId);
    console.log("uid:", uid);

    // First, verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError) {
      console.error("Supabase error fetching project:", projectError);
    }

    if (projectError || !project) {
      return NextResponse.json(
        {
          message:
            "Project not found or you do not have permission to view it.",
        },
        { status: 404 }
      );
    }

    const { data: objects, error } = await supabaseAdmin
      .from("project_objects")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        {
          message: "Failed to fetch project objects from database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ objects }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching project objects:", error);
    return NextResponse.json(
      { message: "Failed to fetch project objects", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const { projectId } = await params;

    // First, verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          message:
            "Project not found or you do not have permission to create objects in it.",
        },
        { status: 404 }
      );
    }

    const { type, zone, ...restObjectData } = await req.json(); // Destructure to exclude 'zone' and extract 'type'

    const { data, error } = await supabaseAdmin
      .from("project_objects")
      .insert({ ...restObjectData, project_id: projectId, object_type: type })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          message: "Failed to create project object in database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project object created successfully", object: data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating project object:", error);
    return NextResponse.json(
      { message: "Failed to create project object", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
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
    const { projectId } = params;

    // Verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          message:
            "Project not found or you do not have permission to delete its objects.",
        },
        { status: 404 }
      );
    }

    // Delete all objects for the given project
    const { error: deleteError } = await supabaseAdmin
      .from("project_objects")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        {
          message: "Failed to delete project objects.",
          error: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "All objects for the project have been deleted." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting project objects:", error);
    return NextResponse.json(
      { message: "Failed to delete project objects", error: error.message },
      { status: 500 }
    );
  }
}
