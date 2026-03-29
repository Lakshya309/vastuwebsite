import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase'
import { prisma } from '../../../../lib/db'
import { r2Client, BUCKET_NAME } from '../../../../lib/r2'
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // Authorization check (optional, but good practice since Supabase was initialized)
  const supabase = await createServerSupabaseClient()
  const { projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.projects.findFirst({
      where: { 
        id: projectId,
        user_id: user.id 
      },
      include: {
        project_objects: {
          select: {
            id: true,
            object_type: true,
            boundary_normalized: true,
            centroid: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    let floor_plan_path = null

    if (project.active_map_plot_id) {
      const mapPlot = await prisma.map_plots.findUnique({
        where: { id: project.active_map_plot_id },
        select: { storage_path: true },
      })

      if (mapPlot && mapPlot.storage_path) {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: mapPlot.storage_path,
          })
          
          // Generate an expiring presigned URL (valid for 1 hour)
          floor_plan_path = await getSignedUrl(r2Client, command, { expiresIn: 3600 })
        } catch (storageError) {
          console.error("Error generating pre-signed URL for R2:", storageError)
        }
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
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
      updates.completed_at = new Date()
    }
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  try {
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: updates,
    })

    return NextResponse.json(
      { message: 'Project updated successfully', project: updatedProject },
      { status: 200 }
    )
  } catch (error: any) {
    // If the record to update does not exist, Prisma throws P2025
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  try {
    // 1. Fetch all map plots to delete their files from Cloudflare R2
    const mapPlots = await prisma.map_plots.findMany({
      where: { project_id: projectId },
      select: { storage_path: true }
    });

    // 2. Delete each associated file from R2 storage
    if (mapPlots.length > 0) {
      await Promise.all(
        mapPlots.map(async (plot) => {
          if (plot.storage_path) {
            try {
              const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: plot.storage_path,
              });
              await r2Client.send(command);
            } catch (r2Error) {
              console.error(`Failed to delete file from R2: ${plot.storage_path}`, r2Error);
            }
          }
        })
      );
    }

    // 3. Prisma will automatically cascade-delete related analyses, project_objects, 
    // and map_plots due to the setup in schema.prisma (`onDelete: Cascade` on the relations)
    await prisma.projects.delete({
      where: { id: projectId },
    })

    return NextResponse.json(
      { message: 'Project and all related data deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project', details: error.message },
      { status: 500 }
    )
  }
}
