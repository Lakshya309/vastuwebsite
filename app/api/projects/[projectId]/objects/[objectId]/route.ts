import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../../lib/supabase";
import { prisma } from "../../../../../../lib/db";

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
    const project = await prisma.projects.findFirst({
      where: { id: projectId, user_id: uid },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        {
          message:
            "Project not found or you do not have permission to modify objects in it.",
        },
        { status: 404 }
      );
    }

    const { type, zone, ...restObjectData } = await req.json(); // Destructure to exclude 'zone' and extract 'type'

    const updatedObject = await prisma.project_objects.updateMany({
      where: { id: objectId, project_id: projectId },
      data: { ...restObjectData, object_type: type },
    });

    if (updatedObject.count === 0) {
      return NextResponse.json(
        { message: "Object not found" },
        { status: 404 }
      );
    }

    // Fetch the updated object
    const finalObject = await prisma.project_objects.findUnique({
      where: { id: objectId },
    });

    return NextResponse.json(
      { message: "Project object updated successfully", object: finalObject },
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
    const project = await prisma.projects.findFirst({
      where: { id: projectId, user_id: uid },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json(
        {
          message:
            "Project not found or you do not have permission to delete objects in it.",
        },
        { status: 404 }
      );
    }

    const deleteResult = await prisma.project_objects.deleteMany({
      where: { id: objectId, project_id: projectId },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: "Object not found" },
        { status: 404 }
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
