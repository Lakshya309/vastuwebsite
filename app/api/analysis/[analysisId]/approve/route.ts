import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function PUT(req: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized: No token provided" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const awaitedParams = await params;
    const { analysisId } = awaitedParams;

    // 1. Check if the user is an astrologer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .single();

    if (profileError || (profile?.role !== 'astrologer' && profile?.role !== 'dev')) {
      return NextResponse.json({ message: "Forbidden: You do not have permission to perform this action." }, { status: 403 });
    }

    // 2. Update the analysis status
    const { data, error } = await supabaseAdmin
      .from("analyses")
      .update({ status: "reviewed" })
      .eq("id", analysisId)
      .select()
      .single();

    if (error) {
      console.error("Supabase analysis update error:", error);
      return NextResponse.json({ message: "Failed to approve analysis", error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Analysis approved successfully", analysis: data }, { status: 200 });
  } catch (error: any) {
    console.error("Error approving analysis:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Failed to approve analysis", error: error.message }, { status: 500 });
  }
}
