import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin"; // Import Supabase Admin client

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

    // 1. Upload file to Supabase Storage using admin client
    const { error: uploadError } = await supabaseAdmin.storage
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
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("floor-plans")
      .getPublicUrl(fileName);

    const floorPlanUrl = publicUrlData.publicUrl;

    // 3. Update the project in the database with the new floor_plan_url
    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({ floor_plan_path: floorPlanUrl }) // Use floor_plan_path as per schema
      .eq("id", projectId)
      .eq("user_id", uid); // Ensure user can only update their own projects

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

    return NextResponse.json(
      { message: "File uploaded and project updated successfully", url: floorPlanUrl },
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
