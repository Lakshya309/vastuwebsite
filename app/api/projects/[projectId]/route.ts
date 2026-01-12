import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../lib/firebaseAdmin";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId } = await params;
    const { searchParams } = new URL(req.url);
    const includeAnalysis = searchParams.get("include_analysis") === "true";

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json({ message: "Failed to fetch project from database", error: error.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ message: "Project not found or you do not have permission to view it." }, { status: 404 });
    }

    if (includeAnalysis) {
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from("analyses")
        .select(`*, analysis_items (*)`)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (analysisError && analysisError.code !== 'PGRST116') { // Ignore 'exact one row not found'
        console.error("Supabase analysis fetch error:", analysisError);
      }
      
      return NextResponse.json({ project: { ...project, analysis: analysis || null } }, { status: 200 });
    }

    return NextResponse.json({ project }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching project:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to fetch project", error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId } = await params;

    const { boundary_normalized, north_direction } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update({ boundary_normalized, north_direction })
      .eq("id", projectId)
      .eq("user_id", uid)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ message: "Failed to update project in database", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Project updated successfully", project: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating project:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to update project", error: error.message }, { status: 500 });
  }
}
