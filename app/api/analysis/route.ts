import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebaseAdmin";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

interface PlacedObject {
  type: string;
  boundary_normalized: { x: number; y: number }[];
  zone: string;
}

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { projectId, objects } = await req.json();

    if (!projectId || !objects || !Array.isArray(objects) || objects.length === 0) {
      return NextResponse.json({ message: "Project ID and a list of objects are required" }, { status: 400 });
    }

    // 1. Verify user owns the project
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !projectData) {
        return NextResponse.json({ message: "Project not found or you do not have permission." }, { status: 404 });
    }

    // 2. Create a new analysis record
    const { data: analysisData, error: analysisError } = await supabaseAdmin
      .from("analyses")
      .insert({ project_id: projectId, status: "pending" })
      .select()
      .single();

    if (analysisError) {
      console.error("Supabase analysis insert error:", analysisError);
      return NextResponse.json({ message: "Failed to create analysis", error: analysisError.message }, { status: 500 });
    }
    
    const analysisId = analysisData.id;

    // 3. Format the analysis items from the placed objects
    const analysisItems = objects.map((obj: PlacedObject) => ({
      analysis_id: analysisId,
      object: obj.type,
      direction: obj.zone,
      boundary_normalized: obj.boundary_normalized,
      source: "manual",
      confidence: 1.0, // Manual entries are 100% confident
    }));

    // 4. Insert the items into the database
    const { error: itemsError } = await supabaseAdmin
      .from("analysis_items")
      .insert(analysisItems);

    if (itemsError) {
      console.error("Supabase analysis_items insert error:", itemsError);
      // Optional: Clean up by deleting the analysis record if items fail
      await supabaseAdmin.from("analyses").delete().eq("id", analysisId);
      return NextResponse.json({ message: "Failed to save analysis items", error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Analysis created successfully", analysisId: analysisId }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating analysis:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to create analysis", error: error.message }, { status: 500 });
  }
}