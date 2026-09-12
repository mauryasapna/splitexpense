import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function getCategoriesData() {
  let res = await supabase.from("expense_category").select("*").order("id", { ascending: true });
  if (res.error && (res.error.message.includes("schema cache") || res.error.message.includes("does not exist"))) {
    res = await supabase.from("categories").select("*").order("id", { ascending: true });
  }
  return res;
}

export async function GET() {
  try {
    const { data: categories, error } = await getCategoriesData();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: roles } = await supabase.from("users_role").select("*");
    const roleMap = new Map((roles || []).map((r) => [r.id.toString(), r]));

    const enriched = (categories || []).map((c) => ({
      ...c,
      users_role: c.user_role_id ? roleMap.get(c.user_role_id.toString()) : null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { exp_name, exp_desc, user_role_id, is_active } = body;

    if (!exp_name || !exp_name.trim()) {
      return NextResponse.json({ error: "exp_name is required" }, { status: 400 });
    }

    const payload = {
      exp_name: exp_name.trim(),
      exp_desc: exp_desc?.trim() || "",
      user_role_id: user_role_id || null,
      is_active: is_active !== undefined ? is_active : true,
    };

    let { data, error } = await supabase
      .from("expense_category")
      .insert([payload])
      .select();

    // Fallback 1: If user_role_id foreign key constraint fails, retry without user_role_id
    if (error && (error.message.includes("user_role_id") || error.message.includes("violates foreign key"))) {
      console.warn("Retrying expense_category insert without user_role_id:", error.message);
      const { user_role_id: _unused, ...payloadWithoutRole } = payload;
      const fallbackResult = await supabase
        .from("expense_category")
        .insert([payloadWithoutRole])
        .select();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    // Fallback 2: If table expense_category is not found, try categories table
    if (error && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
      const fallbackResult = await supabase
        .from("categories")
        .insert([payload])
        .select();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: "Ensure 'expense_category' table exists and RLS is configured in Supabase.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: data ? data[0] : null, success: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
