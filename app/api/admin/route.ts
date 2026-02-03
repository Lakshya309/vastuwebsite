import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // ✅ AWAIT the client
    const supabase = await createServerSupabaseClient();

    // 2️⃣ Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    console.log("Logged-in user ID:", user.id);

    // 3️⃣ Fetch user role from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { message: "Error fetching user profile." },
        { status: 500 }
      );
    }

    if (!profile || profile.role !== "admin") {
      console.log("Forbidden: User role is not admin", profile);
      return NextResponse.json(
        { message: "Forbidden: Only administrators can perform this action." },
        { status: 403 }
      );
    }

    // 4️⃣ Parse request JSON
    const { action, userId, newRole, amount, validFrom, validTo } = await req.json();

    let result;
    let error;

    // 5️⃣ Handle actions
    switch (action) {
      case "updateRole":
        if (!userId || !newRole) {
          return NextResponse.json(
            { message: "userId and newRole are required for updateRole action." },
            { status: 400 }
          );
        }
        ({ data: result, error } = await supabaseAdmin.rpc(
          "admin_update_user_role",
          { p_user_id: userId, p_new_role: newRole }
        ));
        break;

      case "adjustCredits":
        if (!userId || amount === undefined || amount === null) {
          return NextResponse.json(
            { message: "userId and amount are required for adjustCredits action." },
            { status: 400 }
          );
        }
        ({ data: result, error } = await supabaseAdmin.rpc(
          "admin_adjust_user_credits",
          { p_user_id: userId, p_amount: amount }
        ));
        break;

      case "updateAstrologerAccess":
        if (!userId || !validFrom || !validTo) {
          return NextResponse.json(
            { message: "userId, validFrom, and validTo are required for updateAstrologerAccess action." },
            { status: 400 }
          );
        }
        ({ data: result, error } = await supabaseAdmin.rpc(
          "admin_update_astrologer_access",
          { p_user_id: userId, p_valid_from: validFrom, p_valid_to: validTo }
        ));
        break;

      default:
        return NextResponse.json({ message: "Invalid admin action." }, { status: 400 });
    }

    if (error) {
      console.error("Supabase admin RPC error:", error);
      return NextResponse.json(
        { message: `Failed to perform admin action: ${error.message}`, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Admin action '${action}' completed successfully.`, result },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in admin API route:", err);
    return NextResponse.json(
      { message: "Failed to perform admin action", error: err.message },
      { status: 500 }
    );
  }
}
