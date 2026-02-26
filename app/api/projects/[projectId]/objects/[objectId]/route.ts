import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../../lib/supabase";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; objectId: string }> }
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
    const { projectId, objectId } = await context.params;

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
            "Project not found or you do not have permission to modify objects in it.",
        },
        { status: 404 }
      );
    }

    const { type, zone, ...restObjectData } = await req.json(); // Destructure to exclude 'zone' and extract 'type'

    const { data, error } = await supabaseAdmin
      .from("project_objects")
      .update({ ...restObjectData, object_type: type }) // Update with mapped type
      .eq("id", objectId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        {
          message: "Failed to update project object in database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project object updated successfully", object: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating project object:", error);
    return NextResponse.json(
      { message: "Failed to update project object", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; objectId: string }> }
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
    const { projectId, objectId } = await context.params;

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
            "Project not found or you do not have permission to delete objects in it.",
        },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from("project_objects")
      .delete()
      .eq("id", objectId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        {
          message: "Failed to delete project object from database",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project object deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting project object:", error);
    return NextResponse.json(
      { message: "Failed to delete project object", error: error.message },
      { status: 500 }
    );
  }
}
