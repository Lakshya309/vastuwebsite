import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/lib/auth";
import { prisma } from "../../../lib/db";
import { r2Client, BUCKET_NAME } from "../../../lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuth();
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { message: authResult.error || "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    const uid = authResult.user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }
    
    // Validate File Size (Max 5MB)
    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { message: "File exceeds the 5MB limit. Please upload a smaller floor plan." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required" },
        { status: 400 }
      );
    }

    // Get user profile and credits
    const profile = await prisma.profiles.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    const userCredits = await prisma.user_credits.findUnique({
      where: { user_id: uid },
      select: { credits: true }
    });

    const userSub = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: uid,
        status: { in: ['active', 'trialing'] },
        expires_at: { gt: new Date() }
      }
    });

    const isAdminOrAstrologer = profile?.role === 'admin' || profile?.role === 'astrologer';
    const hasPaidAccess = isAdminOrAstrologer || !!userSub || (userCredits?.credits ?? 0) > 0;

    if (!hasPaidAccess) {
      return NextResponse.json(
        { message: "Map Upload is restricted to Basic (₹999+GST) and Advanced (₹2500+GST) plans. Free tier allows manual plot entry only." },
        { status: 403 }
      );
    }

    // Validate Re-upload limits (Max 2 uploads per project)
    const uploadCount = await prisma.map_plots.count({
      where: { project_id: projectId }
    });

    if (uploadCount >= 2 && !isAdminOrAstrologer) {
      return NextResponse.json(
        { message: "Maximum upload limit reached. You can only re-upload once." },
        { status: 403 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    // Store in /map-plots folder directly in Cloudflare R2
    const fileName = `map-plots/${uid}/${projectId}/${Date.now()}_${file.name}`;

    // 1. Upload file to Cloudflare R2 Storage
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: fileBuffer,
          ContentType: file.type,
        })
      );
    } catch (uploadError: any) {
      console.error("R2 upload error:", uploadError);
      return NextResponse.json(
        {
          message: "Failed to upload file to storage",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // 2. Deactivate all other map plots for this project
    try {
      await prisma.map_plots.updateMany({
        where: { project_id: projectId },
        data: { is_active: false },
      });
    } catch (updateError: any) {
      console.error("Prisma DB update error (deactivate):", updateError);
      return NextResponse.json(
        {
          message: "Failed to deactivate old map plots",
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    // 3. Create a new map plot record
    let newMapPlot;
    try {
      newMapPlot = await prisma.map_plots.create({
        data: {
          project_id: projectId,
          storage_path: fileName,
          is_active: true,
        },
      });
    } catch (insertError: any) {
      console.error("Prisma DB insert error:", insertError);
      return NextResponse.json(
        {
          message: "Failed to save new map plot to database",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // 4. Update the project with the new active map plot
    let updatedProject;
    try {
      updatedProject = await prisma.projects.update({
        where: { id: projectId },
        data: { active_map_plot_id: newMapPlot.id },
      });
    } catch (projectUpdateError: any) {
      console.error("Prisma DB project update error:", projectUpdateError);
      return NextResponse.json(
        {
          message: "Failed to update project with new active map plot",
          error: projectUpdateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "File uploaded and project updated successfully", project: updatedProject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Failed to upload file", error: error.message },
      { status: 500 }
    );
  }
}
