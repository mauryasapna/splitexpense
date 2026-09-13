import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("group_id");

    let query = supabase.from("group_members").select("*");
    if (groupId) {
      query = query.eq("group_id", groupId);
    }

    const { data: members, error: gmErr } = await query;
    if (gmErr) {
      return NextResponse.json({ error: gmErr.message }, { status: 400 });
    }

    const { data: allUsers } = await supabase.from("users").select("*");
    const userMap = new Map((allUsers || []).map((u) => [u.id.toString(), u]));

    let { data: allGroups } = await supabase.from("split_group").select("*");
    if (!allGroups || allGroups.length === 0) {
      const fallback = await supabase.from("spllit_group").select("*");
      if (fallback.data) allGroups = fallback.data;
    }
    const groupMap = new Map((allGroups || []).map((g) => [g.id.toString(), g]));

    const enriched = (members || []).map((m) => ({
      ...m,
      users: userMap.get(m.user_id?.toString()) || { id: m.user_id, user_name: `User ${m.user_id}` },
      split_group: groupMap.get(m.group_id?.toString()) || { id: m.group_id, group_name: `Group ${m.group_id}` },
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
    const { group_id, user_id, sharing_pct, is_active } = body;

    if (!group_id || !user_id) {
      return NextResponse.json(
        { error: "group_id and user_id are required" },
        { status: 400 }
      );
    }

    const payload = {
      group_id,
      user_id,
      sharing_pct: sharing_pct !== undefined ? Number(sharing_pct) : 0,
      is_active: is_active !== undefined ? is_active : true,
    };

    let { data, error } = await supabase
      .from("group_members")
      .insert([payload])
      .select();

    if (error && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
      const fallbackResult = await supabase
        .from("group_member")
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
          hint: "Check foreign key constraints between group_members, split_group, and users.",
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

    const { error } = await supabase.from("group_members").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
