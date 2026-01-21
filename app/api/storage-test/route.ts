// app/api/storage-test/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST() {
  const fileContent = Buffer.from("hello supabase");

  const { data, error } = await supabaseAdmin.storage
    .from("floor-plans")
    .upload(`test-${Date.now()}.txt`, fileContent);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
