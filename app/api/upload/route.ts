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

    // 2. Get public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("floor-plans")
      .getPublicUrl(fileName);

    const floorPlanUrl = publicUrlData.publicUrl;

    if (!floorPlanUrl) {
      return NextResponse.json(
        { message: "Failed to get public URL of the file" },
        { status: 500 }
      );
    }

    // 3. Update the project in the database with the new floor_plan_url
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({ floor_plan_path: floorPlanUrl }) // Use floor_plan_path as per schema
      .eq("id", projectId)
      .eq("user_id", uid)
      .select();

    if (updateError) {
      console.error("Supabase DB update error:", updateError);
      return NextResponse.json(
        {
          message: "Failed to save file URL to database",
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedProject || updatedProject.length === 0) {
      return NextResponse.json(
        {
          message: "Project not found or user does not have permission to update it",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "File uploaded and project updated successfully", project: updatedProject[0] },
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
