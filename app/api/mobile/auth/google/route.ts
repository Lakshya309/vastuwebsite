import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify token using Google's public tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!response.ok) {
      console.error("Google token verification failed:", await response.text());
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const payload = await response.json();
    
    const email = payload.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email not provided by Google" }, { status: 400 });
    }

    // Check if user already exists
    let profile = await prisma.profiles.findFirst({
      where: { email },
    });

    if (!profile) {
      // Create new user if they don't exist
      const newId = randomUUID();

      profile = await prisma.$transaction(async (tx) => {
        const newProfile = await tx.profiles.create({
          data: {
            id: newId,
            email: email,
            role: "user",
            // No password for Google sign-in users
          },
        });

        await tx.user_credits.create({
          data: { user_id: newId, credits: 0 },
        });

        return newProfile;
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || "fallback_secret_please_change";
    const token = jwt.sign(
      { 
        id: profile.id, 
        email: profile.email,
        role: profile.role 
      }, 
      jwtSecret, 
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Google Login successful",
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Mobile Google Auth Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
