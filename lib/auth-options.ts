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
        console.log("[AUTH DEBUG] Starting credentials auth...");
        console.log("[AUTH DEBUG] Email:", credentials?.email);
        
        // Mask the password in DATABASE_URL before logging
        const dbUrl = process.env.DATABASE_URL || "";
        const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
        console.log("[AUTH DEBUG] DATABASE_URL in use:", maskedDbUrl);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH DEBUG] Missing email or password");
          throw new Error("Missing email or password");
        }

        try {
          const normalizedEmail = credentials.email.trim().toLowerCase();

          const profile = await prisma.profiles.findFirst({
            where: {
              email: { equals: normalizedEmail, mode: "insensitive" }
            }
          });

          console.log("[AUTH DEBUG] Profile query finished. Found profile?", !!profile);

          if (!profile) {
            console.log("[AUTH DEBUG] No profile found for email:", normalizedEmail);
            throw new Error("Invalid email or password");
          }

          if (!(profile as any).password) {
            console.log("[AUTH DEBUG] Profile found but has no password hash");
            throw new Error("This account is linked to Google. Please sign in with Google.");
          }

          const isValid = verifyPassword(credentials.password, (profile as any).password);
          console.log("[AUTH DEBUG] Password verification result:", isValid);

          if (!isValid) {
            console.log("[AUTH DEBUG] Password check failed");
            throw new Error("Invalid email or password");
          }

          console.log("[AUTH DEBUG] Auth successful for user id:", profile.id);
          return {
            id: profile.id,
            email: profile.email,
            name: profile.email ? profile.email.split("@")[0] : "User",
          };
        } catch (dbError: any) {
          console.error("[AUTH DEBUG] Database/Query Error:", dbError);
          throw new Error(dbError.message || "Database connection error");
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const normalizedEmail = user.email.trim().toLowerCase();

      try {
        // Attempt to find the user first using case-insensitive email match
        let profile = await prisma.profiles.findFirst({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" }
          }
        });

        if (!profile) {
          const newId = randomUUID();
          
          // Use a transaction to do both inserts at exactly the same time
          await prisma.$transaction([
            prisma.profiles.create({
              data: {
                id: newId,
                email: normalizedEmail,
                role: "user",
              },
            }),
            prisma.user_credits.create({
              data: {
                user_id: newId,
                credits: 0,
              },
            })
          ]);
          
          user.id = newId;
        } else {
          user.id = profile.id;
          
          // Ensure user_credits record exists for existing user profile
          await prisma.user_credits.upsert({
            where: { user_id: profile.id },
            update: {},
            create: {
              user_id: profile.id,
              credits: 0,
            },
          });
        }

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
