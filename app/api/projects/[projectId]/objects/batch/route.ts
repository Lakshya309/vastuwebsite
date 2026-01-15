import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../../lib/firebaseAdmin";
import { supabaseAdmin } from "../../../../../../lib/supabaseAdmin";

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

    const { objectsToSave, objectsToDelete } = await req.json();

    // 1. Handle Deletions
    if (objectsToDelete && objectsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("project_objects")
        .delete()
        .in("id", objectsToDelete);

      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json({ message: "Failed to delete objects.", error: deleteError.message }, { status: 500 });
      }
    }

    // 2. Handle Upsertions
    if (objectsToSave && objectsToSave.length > 0) {
      const objectsToUpsert = objectsToSave.map((obj: any) => {
        // If the ID is a temporary one (like a date string), remove it so the DB can generate a UUID
        const isTempId = isNaN(Date.parse(obj.id));
        if (!isTempId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = obj;
          return { ...rest, project_id: projectId };
        }
        return { ...obj, project_id: projectId };
      });

      const { error: upsertError } = await supabaseAdmin
        .from("project_objects")
        .upsert(objectsToUpsert, { onConflict: "id", ignoreDuplicates: false });

      if (upsertError) {
        console.error("Supabase upsert error:", upsertError);
        return NextResponse.json({ message: "Failed to save objects.", error: upsertError.message }, { status: 500 });
      }
    }

    // 3. Fetch and return the current state of all objects for the project
    const { data: finalObjects, error: fetchError } = await supabaseAdmin
      .from("project_objects")
      .select("*")
      .eq("project_id", projectId);

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ message: "Objects saved, but failed to fetch updated list.", error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Configuration saved successfully", objects: finalObjects }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing batch objects:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to process batch objects", error: error.message }, { status: 500 });
  }
}
