import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // ✅ Create session Supabase client (IMPORTANT)
    const supabase = await createServerSupabaseClient();

    // 1️⃣ Get logged-in user
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

    // 2️⃣ Fetch user role using session client
    const { data: profile, error: profileError } = await supabase
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

    // ✅ JS layer admin check
    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can perform this action." },
        { status: 403 }
      );
    }

    // 3️⃣ Parse request body
    const { action, userId, newRole, amount, validFrom, validTo } =
      await req.json();

    let result;
    let error;

    // 4️⃣ Handle Admin Actions
    switch (action) {
      case "updateRole":
        if (!userId || !newRole) {
          return NextResponse.json(
            { message: "userId and newRole required." },
            { status: 400 }
          );
        }

        ({ data: result, error } = await supabase.rpc(
          "admin_update_user_role",
          {
            p_user_id: userId,
            p_new_role: newRole,
          }
        ));
        break;

      case "adjustCredits":
        if (!userId || amount === undefined) {
          return NextResponse.json(
            { message: "userId and amount required." },
            { status: 400 }
          );
        }

        ({ data: result, error } = await supabase.rpc(
          "admin_adjust_user_credits",
          {
            p_user_id: userId,
            p_amount: amount,
          }
        ));
        break;

      case "updateAstrologerAccess":
        if (!userId || !validFrom || !validTo) {
          return NextResponse.json(
            { message: "userId, validFrom and validTo required." },
            { status: 400 }
          );
        }

        ({ data: result, error } = await supabase.rpc(
          "admin_update_astrologer_access",
          {
            p_user_id: userId,
            p_valid_from: validFrom,
            p_valid_to: validTo,
          }
        ));
        break;

      default:
        return NextResponse.json(
          { message: "Invalid admin action." },
          { status: 400 }
        );
    }

    // 5️⃣ Handle RPC errors
    if (error) {
      console.error("Supabase admin RPC error:", error);

      return NextResponse.json(
        {
          message: `Failed to perform admin action: ${error.message}`,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Admin action '${action}' completed successfully.`,
        result,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error in admin API route:", err);

    return NextResponse.json(
      {
        message: "Failed to perform admin action",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
