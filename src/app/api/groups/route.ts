import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function getGroupsData() {
  let res = await supabase.from("split_group").select("*").order("id", { ascending: false });
  if (res.error && (res.error.message.includes("schema cache") || res.error.message.includes("does not exist"))) {
    res = await supabase.from("spllit_group").select("*").order("id", { ascending: false });
  }
  return res;
}

export async function GET() {
  try {
    const { data: groups, error: groupError } = await getGroupsData();

    if (groupError) {
      return NextResponse.json(
        {
          error: groupError.message,
          hint: "Run the SQL script in Supabase SQL Editor to create the 'split_group' table.",
        },
        { status: 400 }
      );
    }

    let { data: members, error: gmErr } = await supabase.from("group_members").select("*");
    if (gmErr && (gmErr.message.includes("schema cache") || gmErr.message.includes("does not exist"))) {
      const fallbackGm = await supabase.from("group_member").select("*");
      if (fallbackGm.data) members = fallbackGm.data;
    }
    const { data: allUsers } = await supabase.from("users").select("*");
    const { data: logs } = await supabase.from("expense_log").select("split_group_id, exp_amount");

    const userMap = new Map((allUsers || []).map((u) => [u.id.toString(), u]));

    // Calculate total expenses per group
    const groupTotals = new Map<string, number>();
    (logs || []).forEach((l) => {
      if (l.split_group_id) {
        const gid = l.split_group_id.toString();
        const amt = Number(l.exp_amount) || 0;
        groupTotals.set(gid, (groupTotals.get(gid) || 0) + amt);
      }
    });

    const populated = (groups || []).map((g) => {
      const gMembers = (members || [])
        .filter((m) => m.group_id?.toString() === g.id?.toString())
        .map((m) => ({
          ...m,
          users: userMap.get(m.user_id?.toString()) || { id: m.user_id, user_name: `User ${m.user_id}` },
        }));

      return {
        ...g,
        members: gMembers,
        total_expenses: groupTotals.get(g.id.toString()) || 0,
      };
    });

    return NextResponse.json({ data: populated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { group_name, group_desc, members: inputMembers } = body;

    if (!group_name || !group_name.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    // 1. Create split group (try split_group first, fallback to spllit_group)
    const newGroupPayload = {
      group_name: group_name.trim(),
      group_desc: group_desc?.trim() || "",
      is_active: true,
    };

    let { data: groupData, error: groupErr } = await supabase
      .from("split_group")
      .insert([newGroupPayload])
      .select();

    if (groupErr && (groupErr.message.includes("schema cache") || groupErr.message.includes("does not exist"))) {
      const fallback = await supabase
        .from("spllit_group")
        .insert([newGroupPayload])
        .select();
      groupData = fallback.data;
      groupErr = fallback.error;
    }

    if (groupErr) {
      return NextResponse.json(
        {
          error: groupErr.message,
          hint: "Please ensure 'split_group' table is created in Supabase SQL editor.",
        },
        { status: 400 }
      );
    }

    const newGroup = groupData ? groupData[0] : null;
    if (!newGroup) {
      return NextResponse.json({ error: "Failed to create group record" }, { status: 500 });
    }

    // 2. Fetch default role id if needed for newly created users
    const { data: roles } = await supabase.from("users_role").select("id, user_role_name");
    const defaultRoleId =
      roles?.find((r) => r.user_role_name.toLowerCase().includes("member"))?.id ||
      roles?.[0]?.id ||
      null;

    // 3. Handle group members
    const memberList: { name: string; pct?: number; user_id?: string | number }[] =
      Array.isArray(inputMembers) && inputMembers.length > 0
        ? inputMembers
        : [{ name: "You (Admin)" }, { name: "Rahul" }, { name: "Priya" }];

    const defaultPct = Number((100 / memberList.length).toFixed(2));

    for (const item of memberList) {
      let uId: string | number | null = item.user_id || null;

      if (!uId && item.name) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .ilike("user_name", item.name.trim())
          .limit(1);

        if (existingUser && existingUser.length > 0) {
          uId = existingUser[0].id;
        } else {
          const { data: newUser, error: uErr } = await supabase
            .from("users")
            .insert([
              {
                user_name: item.name.trim(),
                user_role_id: defaultRoleId,
                is_active: true,
              },
            ])
            .select();

          if (newUser && newUser[0]) {
            uId = newUser[0].id;
          } else if (uErr) {
            console.warn("User insert error:", uErr.message);
          }
        }
      }

      if (uId) {
        let { error: gmErr } = await supabase.from("group_members").insert([
          {
            group_id: newGroup.id,
            user_id: uId,
            sharing_pct: item.pct !== undefined ? Number(item.pct) : defaultPct,
            is_active: true,
          },
        ]);

        if (gmErr && (gmErr.message.includes("schema cache") || gmErr.message.includes("does not exist"))) {
          const fallbackGm = await supabase.from("group_member").insert([
            {
              group_id: newGroup.id,
              user_id: uId,
              sharing_pct: item.pct !== undefined ? Number(item.pct) : defaultPct,
              is_active: true,
            },
          ]);
          gmErr = fallbackGm.error;
        }

        if (gmErr) {
          console.warn("Warning inserting group member:", gmErr.message);
        }
      }
    }

    return NextResponse.json({ data: newGroup, success: true }, { status: 201 });
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
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    // 1. Delete associated group members
    await supabase.from("group_members").delete().eq("group_id", id);

    // 2. Delete associated expense logs or unassign them
    await supabase.from("expense_log").delete().eq("split_group_id", id);

    // 3. Delete the group (try split_group, fallback to spllit_group)
    let { error } = await supabase.from("split_group").delete().eq("id", id);
    if (error && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
      const fallback = await supabase.from("spllit_group").delete().eq("id", id);
      error = fallback.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
