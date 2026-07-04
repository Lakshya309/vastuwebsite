import { NextResponse } from "next/server";
import { validateAuth } from '@/lib/auth';
import { prisma } from '../../../../../lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
  }
  const { projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 },
    );
  }

  try {
    const objects = await prisma.project_objects.findMany({
      where: { project_id: projectId },
    });

    return NextResponse.json({ objects }, { status: 200 });
  } catch (err: any) {
    console.error("Server-side error:", err);
    return NextResponse.json(
      { error: "Failed to fetch objects", details: err.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const authResult = await validateAuth();
  if (authResult.error || !authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
  }
  const { projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const objects = body?.objects;

  if (!Array.isArray(objects)) {
    return NextResponse.json(
      { error: "Invalid objects data" },
      { status: 400 },
    );
  }

  try {
    // 1️⃣ Delete existing objects for the project
    await prisma.project_objects.deleteMany({
      where: { project_id: projectId },
    });

    // 2️⃣ Prepare new objects
    const objectsToInsert = objects.map((obj: any) => ({
      project_id: projectId,
      object_type: obj.object_type,
      boundary_normalized: obj.boundary_normalized,
      centroid: obj.centroid,
    }));

    if (objectsToInsert.length === 0) {
      return NextResponse.json(
        { message: "No objects to insert", objects: [] },
        { status: 200 },
      );
    }

    // 3️⃣ Insert new objects
    await prisma.project_objects.createMany({
      data: objectsToInsert,
    });

    // Fetch them back to return full objects with IDs
    const insertedObjects = await prisma.project_objects.findMany({
      where: { project_id: projectId },
    });

    return NextResponse.json(
      {
        message: "Objects saved successfully",
        objects: insertedObjects,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Server-side error:", err);
    return NextResponse.json(
      { error: "Failed to save objects", details: err.message },
      { status: 500 },
    );
  }
}
