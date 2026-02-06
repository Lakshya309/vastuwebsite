import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase'

type RouteContext = {
  params: { projectId: string }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { projectId } = await params

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
      floor_plan_path,
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
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { projectId } = await params

  const body = await request.json()
  const updates: Record<string, any> = {}

  if (body.boundary_normalized !== undefined)
    updates.boundary_normalized = body.boundary_normalized

  if (body.north_direction !== undefined)
    updates.north_direction = body.north_direction

  if (!Object.keys(updates).length) {
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
      { error: error.message },
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
