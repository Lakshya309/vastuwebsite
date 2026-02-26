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

  let floor_plan_path = null;
  if (project.active_map_plot_id) {
    const { data: mapPlot, error: mapPlotError } = await supabase
      .from('map_plots')
      .select('storage_path')
      .eq('id', project.active_map_plot_id)
      .single();

    if (mapPlotError) {
      console.error("Error fetching map plot:", mapPlotError);
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(mapPlot.storage_path);
      floor_plan_path = publicUrlData.publicUrl;
    }
  }

  return NextResponse.json(
    {
      project: {
        ...project,
        floor_plan_path: floor_plan_path,
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

  if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === 'completed') {
      updates.completed_at = new Date().toISOString()
    }
  }

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

export async function DELETE(
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

  // 1. Delete related analyses
  const { error: analysesError } = await supabase
    .from('analyses')
    .delete()
    .eq('project_id', projectId)

  if (analysesError) {
    console.error('Error deleting analyses:', analysesError)
    return NextResponse.json(
      { error: 'Failed to delete related analyses', details: analysesError.message },
      { status: 500 }
    )
  }

  // 2. Delete related project_objects
  const { error: objectsError } = await supabase
    .from('project_objects')
    .delete()
    .eq('project_id', projectId)

  if (objectsError) {
    console.error('Error deleting project objects:', objectsError)
    return NextResponse.json(
      { error: 'Failed to delete related project objects', details: objectsError.message },
      { status: 500 }
    )
  }

  // 3. Delete the project itself
  const { error: projectError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (projectError) {
    console.error('Error deleting project:', projectError)
    return NextResponse.json(
      { error: 'Failed to delete project', details: projectError.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { message: 'Project and all related data deleted successfully' },
    { status: 200 }
  )
}
