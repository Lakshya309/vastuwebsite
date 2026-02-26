import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../../lib/supabase";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
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
    const { projectId } = await context.params;

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

    const { objectsToSave, objectsToDelete } = await req.json();

    // 1. Handle Deletions
    if (objectsToDelete && objectsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("project_objects")
        .delete()
        .in("id", objectsToDelete);

      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json(
          { message: "Failed to delete objects.", error: deleteError.message },
          { status: 500 }
        );
      }
    }

    // 2. Handle Insertions for new objects
    if (objectsToSave && objectsToSave.length > 0) {
      const objectsToInsert = objectsToSave.map((obj: any) => {
        const { id, type, zone, ...rest } = obj; // Destructure to exclude 'zone' and extract 'type'
        return {
          ...rest,
          project_id: projectId,
          object_type: type, // Map 'type' from PlacedObject to 'object_type' in schema
        };
      });

      const { error: insertError } = await supabaseAdmin
        .from("project_objects")
        .insert(objectsToInsert);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json(
          {
            message: "Failed to save new objects.",
            error: insertError.message,
          },
          { status: 500 }
        );
      }
    }

    // 3. Fetch and return the current state of all objects for the project
    const { data: finalObjects, error: fetchError } = await supabaseAdmin
      .from("project_objects")
      .select("*")
      .eq("project_id", projectId);

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json(
        {
          message: "Objects saved, but failed to fetch updated list.",
          error: fetchError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Configuration saved successfully", objects: finalObjects },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing batch objects:", error);
    return NextResponse.json(
      { message: "Failed to process batch objects", error: error.message },
      { status: 500 }
    );
  }
}
