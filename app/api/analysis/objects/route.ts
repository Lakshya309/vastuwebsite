import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const MICROSERVICE_URL = process.env.MICROSERVICE_URL || "http://72.61.224.232:8001";
  try {
    const body = await request.json();

    // Call the Python service directly
    const response = await fetch(`${MICROSERVICE_URL}/analyze_objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Python Object Analysis Service Error:", errorData);
        return NextResponse.json({ error: errorData.detail || "Python Object Analysis Service Unreachable or error" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error calling Python Object Analysis Service:", error);
    return NextResponse.json({ error: "Internal Server Error during object analysis" }, { status: 500 });
  }
}
