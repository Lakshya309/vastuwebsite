// app/api/storage-test/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
