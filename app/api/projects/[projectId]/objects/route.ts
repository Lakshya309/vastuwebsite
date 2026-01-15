import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebaseAdmin";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

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
      return NextResponse.json({ message: "Project not found or you do not have permission to view it." }, { status: 404 });
    }

    const { data: objects, error } = await supabaseAdmin
      .from("project_objects")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json({ message: "Failed to fetch project objects from database", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ objects }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching project objects:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to fetch project objects", error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId } = await params;

    // First, verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", uid)
        .single();

    if (projectError || !project) {
        return NextResponse.json({ message: "Project not found or you do not have permission to create objects in it." }, { status: 404 });
    }

    const objectData = await req.json();

    const { data, error } = await supabaseAdmin
      .from("project_objects")
      .insert({ ...objectData, project_id: projectId })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ message: "Failed to create project object in database", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Project object created successfully", object: data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project object:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to create project object", error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { projectId } = params;

    // Verify that the user has access to the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: "Project not found or you do not have permission to delete its objects." }, { status: 404 });
    }

    // Delete all objects for the given project
    const { error: deleteError } = await supabaseAdmin
      .from("project_objects")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ message: "Failed to delete project objects.", error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "All objects for the project have been deleted." }, { status: 200 });
  } catch (error: any)
{
    console.error("Error deleting project objects:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to delete project objects", error: error.message }, { status: 500 });
  }
}
