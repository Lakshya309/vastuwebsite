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

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.profiles.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (existingUser) {
      if (!(existingUser as any).password) {
        // User created account via Google OAuth. Set password so they can log in via both methods to the SAME profile ID.
        const hashedPassword = hashPassword(password);
        await prisma.profiles.update({
          where: { id: existingUser.id },
          data: { password: hashedPassword } as any,
        });

        await prisma.user_credits.upsert({
          where: { user_id: existingUser.id },
          update: {},
          create: {
            user_id: existingUser.id,
            credits: 0,
          },
        });

        return NextResponse.json(
          { message: "Password linked to account successfully", userId: existingUser.id },
          { status: 200 }
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
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
      } as any,
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
