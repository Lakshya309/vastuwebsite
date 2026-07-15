import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function verifyMobileAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.NEXTAUTH_SECRET || "fallback_secret_please_change";
  
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
