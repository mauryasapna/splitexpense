import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("*")
      .order("id", { ascending: true });

    if (userErr) {
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }

    const { data: roles } = await supabase.from("users_role").select("*");
    const roleMap = new Map((roles || []).map((r) => [r.id.toString(), r]));

    const enriched = (users || []).map((u) => ({
      ...u,
      users_role: u.user_role_id ? roleMap.get(u.user_role_id.toString()) : null,
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
    const { user_name, user_role_id, is_active } = body;

    if (!user_name) {
      return NextResponse.json({ error: "user_name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          user_name: user_name.trim(),
          user_role_id: user_role_id || null,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
