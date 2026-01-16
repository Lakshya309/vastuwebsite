import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../../lib/firebaseAdmin";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string, objectId: string }> }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId, objectId } = await params;

    // First, verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: "Project not found or you do not have permission to modify objects in it." }, { status: 404 });
    }

    const objectData = await req.json();

    const { data, error } = await supabaseAdmin
      .from("project_objects")
      .update(objectData)
      .eq("id", objectId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ message: "Failed to update project object in database", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Project object updated successfully", object: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating project object:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to update project object", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string, objectId: string }> }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId, objectId } = await params;

    // First, verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: "Project not found or you do not have permission to delete objects in it." }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("project_objects")
      .delete()
      .eq("id", objectId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ message: "Failed to delete project object from database", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Project object deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting project object:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to delete project object", error: error.message }, { status: 500 });
  }
}
