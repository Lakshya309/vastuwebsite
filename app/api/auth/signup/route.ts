import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.profiles.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      if (!existingUser.password) {
        return NextResponse.json(
          { error: "This email is registered via Google. Please log in using Google." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "User already exists with this email address" },
        { status: 400 }
      );
    }

    const newId = randomUUID();
    const hashedPassword = hashPassword(password);

    // Create the profile
    const profile = await prisma.profiles.create({
      data: {
        id: newId,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "user",
      },
    });

    // Ensure user has a credits record
    await prisma.user_credits.upsert({
      where: { user_id: newId },
      update: {},
      create: {
        user_id: newId,
        credits: 0,
      },
    });

    return NextResponse.json(
      { message: "Registration successful", userId: profile.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
