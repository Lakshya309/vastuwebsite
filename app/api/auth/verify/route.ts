import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebaseAdmin"; // Import adminAuth

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: "ID token is required" }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    return NextResponse.json({ message: "Token verified", uid: uid }, { status: 200 });
  } catch (error: any) {
    console.error("Error verifying ID token:", error);
    return NextResponse.json({ message: "Failed to verify token", error: error.message }, { status: 500 });
  }
}
