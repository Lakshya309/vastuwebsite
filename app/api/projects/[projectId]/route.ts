import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type RouteContext = {
  params: Promise<{ projectId: string }>
}

function createSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        set: (name, value, options) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name, options) =>
          cookieStore.set({ name, value: '', ...options }),
      },
    }
  )
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const cookieStore = await cookies()
  const { projectId } = await params
  const supabase = createSupabaseClient(cookieStore)

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_objects (
        id,
        object_type,
        boundary_normalized,
        centroid
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch project', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      project: {
        ...project,
        placed_objects: project.project_objects ?? [],
      },
    },
    { status: 200 }
  )
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const cookieStore = await cookies()
  const { projectId } = await params
  const supabase = createSupabaseClient(cookieStore)

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const updates: Record<string, any> = {}

  if (body.boundary_normalized !== undefined) {
    updates.boundary_normalized = body.boundary_normalized
  }

  if (body.north_direction !== undefined) {
    updates.north_direction = body.north_direction
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update project', details: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { message: 'Project updated successfully', project: data },
    { status: 200 }
  )
}
