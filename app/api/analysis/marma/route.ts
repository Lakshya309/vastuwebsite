import { NextResponse } from "next/server";
import { getMarmaPoints } from "@/lib/marmaAnalysis";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boundary } = body;

    if (!boundary || boundary.length < 3) {
      return NextResponse.json(
        { error: "Invalid boundary provided" },
        { status: 400 },
      );
    }

    const marmaData = getMarmaPoints(boundary);

    return NextResponse.json(marmaData);
  } catch (error) {
    console.error("Error calculating marma points:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}