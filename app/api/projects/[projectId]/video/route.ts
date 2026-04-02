import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";

// Helper function to get video duration using ffprobe
const getDuration = (path: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(path, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
};

// Helper function to compress video
const compressVideo = (inputPath: string, outputPath: string, targetBitrateKbps: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-preset medium",
        `-b:v ${targetBitrateKbps}k`,
        "-maxrate", `${targetBitrateKbps * 1.5}k`,
        "-bufsize", `${targetBitrateKbps * 2}k`,
        "-c:a aac",
        "-b:a 128k"
      ])
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { projectId } = await params;

  // Temporary file paths for cleanup
  let tempInputPath: string | null = null;
  let tempOutputPath: string | null = null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }
    const uid = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate Hard Maximum (100MB)
    const MAX_FILE_SIZE_MB = 100;
    const sizeInBytes = file.size;
    if (sizeInBytes > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { message: `File exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller video.` },
        { status: 400 }
      );
    }

    const COMPRESSION_THRESHOLD_MB = 10;
    const TARGET_SIZE_MB = 9; // Safety margin to keep it under 10MB
    let finalBuffer: Buffer;
    let contentType = file.type;

    if (sizeInBytes > COMPRESSION_THRESHOLD_MB * 1024 * 1024) {
      console.log(`File size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds 10MB threshold. Compressing...`);
      
      // Setup temp files
      const tempDir = os.tmpdir();
      tempInputPath = path.join(tempDir, `input_${Date.now()}_${file.name}`);
      tempOutputPath = path.join(tempDir, `output_${Date.now()}_${file.name}`);

      // Write File to temp input disk
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(tempInputPath, Buffer.from(arrayBuffer));

      try {
        // Calculate target bitrate
        const duration = await getDuration(tempInputPath);
        if (duration > 0) {
          // Bitrate = (TargetSize bits) / Duration
          // Target Bits = 9MB * 1024 * 1024 * 8
          // We subtract audio bitrate (128k) to get video bitrate
          const totalTargetBits = TARGET_SIZE_MB * 1024 * 1024 * 8;
          let videoBitrateKbps = Math.floor((totalTargetBits / duration) / 1024) - 128;
          
          // Ensure bitrate is at least reasonable (don't go too low)
          if (videoBitrateKbps < 200) videoBitrateKbps = 200;

          console.log(`Calculated target video bitrate: ${videoBitrateKbps}k for duration: ${duration.toFixed(2)}s`);
          
          await compressVideo(tempInputPath, tempOutputPath, videoBitrateKbps);
          
          // Read compressed file back
          finalBuffer = await fs.readFile(tempOutputPath);
          console.log(`Compression complete. Final size: ${(finalBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        } else {
          // If duration probe fails, fallback to original
          finalBuffer = Buffer.from(arrayBuffer);
        }
      } catch (compError) {
        console.error("Compression failed, uploading original:", compError);
        finalBuffer = Buffer.from(arrayBuffer);
      }
    } else {
      finalBuffer = Buffer.from(await file.arrayBuffer());
    }

    // Store in /videos folder in Cloudflare R2
    const fileName = `videos/${uid}/${projectId}/${Date.now()}_${file.name}`;

    // 1. Upload file to Cloudflare R2 Storage
    try {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: finalBuffer,
          ContentType: contentType || "video/mp4",
        })
      );
    } catch (uploadError: any) {
      console.error("R2 upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload video to storage", error: uploadError.message },
        { status: 500 }
      );
    }

    // 2. Update the project with the new video path
    let updatedProject;
    try {
      updatedProject = await prisma.projects.update({
        where: { id: projectId },
        data: { video_path: fileName },
      });
    } catch (projectUpdateError: any) {
      console.error("Prisma DB project update error:", projectUpdateError);
      return NextResponse.json(
        { message: "Failed to update project with new video path", error: projectUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Video uploaded and project updated successfully", project: updatedProject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error uploading video:", error);
    return NextResponse.json(
      { message: "Failed to upload video", error: error.message },
      { status: 500 }
    );
  } finally {
    // Cleanup temporary files
    try {
      if (tempInputPath) await fs.unlink(tempInputPath).catch(() => {});
      if (tempOutputPath) await fs.unlink(tempOutputPath).catch(() => {});
    } catch (cleanupError) {
      console.error("Failed to cleanup temp files:", cleanupError);
    }
  }
}
