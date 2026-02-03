import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function createSupabaseClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        set: (name, value, options) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name, options) =>
          cookieStore.set({ name, value: "", ...options }),
      },
    },
  );
}

export async function GET(request: Request, { params }: RouteContext) {
  const cookieStore = await cookies();
  const { projectId } = await params;
  const supabase = createSupabaseClient(cookieStore);

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("project_objects")
      .select("*")
      .eq("project_id", projectId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ objects: data }, { status: 200 });
  } catch (err: any) {
    console.error("Server-side error:", err);
    return NextResponse.json(
      { error: "Failed to fetch objects", details: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const cookieStore = await cookies();
  const { projectId } = await params;
  const supabase = createSupabaseClient(cookieStore);

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
    const { error: deleteError } = await supabase
      .from("project_objects")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      throw deleteError;
    }

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
    const { data, error: insertError } = await supabase
      .from("project_objects")
      .insert(objectsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        message: "Objects saved successfully",
        objects: data,
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
