import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: logs, error: logError } = await supabase
      .from("expense_log")
      .select("*")
      .order("id", { ascending: false });

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 400 });
    }

    const { data: allUsers } = await supabase.from("users").select("*");
    const { data: categories } = await supabase.from("expense_category").select("*");
    let { data: groups } = await supabase.from("split_group").select("*");
    if (!groups || groups.length === 0) {
      const fallback = await supabase.from("spllit_group").select("*");
      if (fallback.data) groups = fallback.data;
    }

    const userMap = new Map((allUsers || []).map((u) => [u.id.toString(), u]));
    const catMap = new Map((categories || []).map((c) => [c.id.toString(), c]));
    const groupMap = new Map((groups || []).map((g) => [g.id.toString(), g]));

    const enriched = (logs || []).map((l) => ({
      ...l,
      users: userMap.get(l.user_id?.toString()) || (l.user_id ? { id: l.user_id, user_name: `User ${l.user_id}` } : null),
      expense_category: catMap.get(l.expense_cat_id?.toString()) || (l.expense_cat_id ? { id: l.expense_cat_id, exp_name: `Category ${l.expense_cat_id}` } : null),
      split_group: groupMap.get(l.split_group_id?.toString()) || (l.split_group_id ? { id: l.split_group_id, group_name: `Group ${l.split_group_id}` } : null),
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
    const {
      exp_title,
      exp_desc,
      exp_note,
      exp_amount,
      expense_cat_id,
      user_id,
      split_group_id,
      timestamp,
    } = body;

    if (!exp_title || exp_amount === undefined || exp_amount === null) {
      return NextResponse.json(
        { error: "Title and Amount are required" },
        { status: 400 }
      );
    }

    // Verify if split_group_id exists in split_group table
    let validGroupId = split_group_id || null;
    if (validGroupId) {
      let { data: grpCheck } = await supabase
        .from("split_group")
        .select("id")
        .eq("id", validGroupId)
        .limit(1);

      if (!grpCheck || grpCheck.length === 0) {
        const fallbackCheck = await supabase
          .from("spllit_group")
          .select("id")
          .eq("id", validGroupId)
          .limit(1);
        grpCheck = fallbackCheck.data;
      }

      if (!grpCheck || grpCheck.length === 0) {
        console.warn(`split_group_id ${validGroupId} not found in database. Setting to null to avoid constraint error.`);
        validGroupId = null;
      }
    }

    const newRecord = {
      exp_title: exp_title.trim(),
      exp_desc: exp_desc?.trim() || "",
      exp_note: exp_note?.trim() || "",
      exp_amount: parseFloat(exp_amount),
      expense_cat_id: expense_cat_id || null,
      user_id: user_id || null,
      split_group_id: validGroupId,
      timestamp: timestamp || new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("expense_log")
      .insert([newRecord])
      .select();

    // Graceful recovery 1: If split_group_id foreign key constraint fails, retry with split_group_id = null
    if (error && (error.message.includes("expense_log_split_group_id_fkey") || error.message.includes("split_group"))) {
      console.warn("Retrying insert without split_group_id due to foreign key mismatch:", error.message);
      const fallbackRecord = { ...newRecord, split_group_id: null };
      const fallbackResult = await supabase
        .from("expense_log")
        .insert([fallbackRecord])
        .select();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    // Graceful recovery 2: If expense_cat_id foreign key constraint fails, retry without expense_cat_id
    if (error && (error.message.includes("expense_log_expense_cat_id_fkey") || error.message.includes("expense_category"))) {
      console.warn("Retrying insert without expense_cat_id due to database constraint mismatch:", error.message);
      const fallbackRecord = { ...newRecord, expense_cat_id: null };
      const fallbackResult = await supabase
        .from("expense_log")
        .insert([fallbackRecord])
        .select();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    // Graceful recovery 3: If user_id foreign key constraint fails, retry without user_id
    if (error && (error.message.includes("expense_log_user_id_fkey") || error.message.includes("users"))) {
      console.warn("Retrying insert without user_id due to database constraint mismatch:", error.message);
      const fallbackRecord = { ...newRecord, user_id: null };
      const fallbackResult = await supabase
        .from("expense_log")
        .insert([fallbackRecord])
        .select();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: "Ensure foreign keys in expense_log are valid.",
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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase.from("expense_log").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
