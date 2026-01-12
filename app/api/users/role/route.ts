import { adminAuth } from '../../../../lib/firebaseAdmin';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: "No token provided" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', uid);

    if (error) {
      console.error("Supabase select role error:", error);
      return NextResponse.json({ message: "Failed to fetch role", error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ role: data[0].role }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/users/role:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/id-token-revoked') {
      return NextResponse.json({ message: "Unauthorized: Invalid token", error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
