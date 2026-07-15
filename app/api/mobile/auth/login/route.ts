import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/hash";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const profile = await prisma.profiles.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!profile) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!profile.password) {
      return NextResponse.json({ error: "This email was registered with Google. Please use Google Sign-In." }, { status: 401 });
    }

    const isValid = verifyPassword(password, profile.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
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
      message: "Login successful",
      token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role
      }
    });
  } catch (error: any) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
