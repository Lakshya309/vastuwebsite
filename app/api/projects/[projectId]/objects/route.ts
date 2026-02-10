import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const cookieStore = await cookies();
  const { projectId } = await context.params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

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

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const cookieStore = await cookies();
  const { projectId } = await context.params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

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
