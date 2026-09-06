import { NextRequest, NextResponse } from "next/server";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.key.join("/");

    if (!key) {
      return new NextResponse("Key required", { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const stream = response.Body.transformToWebStream();

    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    // Enable long-term caching for static assets
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Public asset fetch error:", error);
    return new NextResponse("Asset not found", { status: 404 });
  }
}
