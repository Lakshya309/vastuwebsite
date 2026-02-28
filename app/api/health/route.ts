import { NextResponse } from "next/server";

export async function GET() {
  const MICROSERVICE_URL = process.env.MICROSERVICE_URL || "http://72.61.224.232:8001";
  try {
    // Forward the health check request to the Python microservice
    const response = await fetch(`${MICROSERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If the microservice is down, return a detailed error
      return NextResponse.json(
        {
          status: "error",
          message: "Health check failed: Python service is unreachable or unhealthy.",
          serviceStatus: response.status,
        },
        { status: 503 } // 503 Service Unavailable
      );
    }

    // Return the successful health check response from the microservice
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    // Catch any network errors during the fetch itself
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed: Could not connect to the Python service.",
      },
      { status: 503 }
    );
  }
}
