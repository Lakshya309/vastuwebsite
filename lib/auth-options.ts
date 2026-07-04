import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import { randomUUID } from "crypto";
import { verifyPassword } from "./hash";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const profile = await prisma.profiles.findFirst({
          where: { email: credentials.email }
        });

        if (!profile || !profile.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = verifyPassword(credentials.password, profile.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.email ? profile.email.split("@")[0] : "User",
        };
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // Look up profile by email
        const existingProfile = await prisma.profiles.findFirst({
          where: { email: user.email },
        });

        if (existingProfile) {
          user.id = existingProfile.id;
          return true;
        }

        // If no existing profile, create a new one with a new UUID
        const newId = randomUUID();
        await prisma.profiles.create({
          data: {
            id: newId,
            email: user.email,
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

        user.id = newId;
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch role from DB
        const dbProfile = await prisma.profiles.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbProfile?.role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
