import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Valid email and a 6+ char password are required" }, { status: 400 });
    }

    const existingUser = await prisma.profiles.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const newId = randomUUID();
    const hashedPassword = hashPassword(password);

    // Create profile and credits in a transaction
    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await (tx.profiles.create as any)({
        data: {
          id: newId,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "user",
        },
      });

      await tx.user_credits.create({
        data: { user_id: newId, credits: 0 },
      });

      return newProfile;
    });

    // Generate JWT token
    const jwtSecret = process.env.NEXTAUTH_SECRET || "fallback_secret_please_change";
    const token = jwt.sign(
      { id: profile.id, email: profile.email, role: profile.role }, 
      jwtSecret, 
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Registration successful",
      token,
      user: { id: profile.id, email: profile.email, role: profile.role }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Mobile Signup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
