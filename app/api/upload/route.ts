import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    const uid = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }
    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${uid}/${projectId}/${Date.now()}_${file.name}`;

    // 1. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("floor-plans")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        {
          message: "Failed to upload file to storage",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // 3. Deactivate all other map plots for this project
    const { error: updateError } = await supabase
      .from("map_plots")
      .update({ is_active: false })
      .eq("project_id", projectId);

    if (updateError) {
      console.error("Supabase DB update error:", updateError);
      return NextResponse.json(
        {
          message: "Failed to deactivate old map plots",
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    // 4. Create a new map plot record
    const { data: newMapPlot, error: insertError } = await supabase
      .from("map_plots")
      .insert({
        project_id: projectId,
        storage_path: fileName,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase DB insert error:", insertError);
      return NextResponse.json(
        {
          message: "Failed to save new map plot to database",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // 5. Update the project with the new active map plot
    const { data: updatedProject, error: projectUpdateError } = await supabase
      .from("projects")
      .update({ active_map_plot_id: newMapPlot.id })
      .eq("id", projectId)
      .select()
      .single();

    if (projectUpdateError) {
      console.error("Supabase DB project update error:", projectUpdateError);
      return NextResponse.json(
        {
          message: "Failed to update project with new active map plot",
          error: projectUpdateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "File uploaded and project updated successfully", project: updatedProject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Failed to upload file", error: error.message },
      { status: 500 }
    );
  }
}
