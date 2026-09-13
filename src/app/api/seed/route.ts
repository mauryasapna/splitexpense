import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // 1. Roles (users_role)
    const { data: existingRoles } = await supabase.from("users_role").select("*");
    let adminRoleId: string | number = 1;
    let memberRoleId: string | number = 2;

    if (!existingRoles || existingRoles.length === 0) {
      const { data: insertedRoles } = await supabase
        .from("users_role")
        .insert([
          { user_role_name: "Admin", user_role_desc: "Group Manager & Bill Admin", is_active: true },
          { user_role_name: "Member", user_role_desc: "Regular Splitting Member", is_active: true },
          { user_role_name: "Guest", user_role_desc: "One-off Expense Participant", is_active: true },
        ])
        .select();

      if (insertedRoles && insertedRoles.length > 0) {
        adminRoleId = insertedRoles[0].id;
        memberRoleId = insertedRoles[1]?.id || insertedRoles[0].id;
      }
    } else {
      adminRoleId = existingRoles[0].id;
      memberRoleId = existingRoles[1]?.id || existingRoles[0].id;
    }

    // 2. Categories (expense_category)
    const { data: existingCats } = await supabase.from("expense_category").select("*");
    if (!existingCats || existingCats.length === 0) {
      const defaultCategories = [
        { exp_name: "Food & Dining 🍔", exp_desc: "Restaurants, Cafes, Snacks, Zomato", is_active: true },
        { exp_name: "Travel & Fuel ✈️", exp_desc: "Flights, Train, Uber, Petrol", is_active: true },
        { exp_name: "Rent & Stay 🏠", exp_desc: "Hotel, Airbnb, Flat Rent", is_active: true },
        { exp_name: "Party & Drinks 🎉", exp_desc: "Clubbing, Drinks, Events", is_active: true },
        { exp_name: "Groceries 🛒", exp_desc: "Supermarket, Blinkit, Instamart", is_active: true },
        { exp_name: "Bills & Utilities ⚡", exp_desc: "WiFi, Electricity, Water", is_active: true },
      ];

      const { error: catErr } = await supabase.from("expense_category").insert(defaultCategories);
      if (catErr) {
        console.warn("Category insert error:", catErr.message);
      }
    }

    // 3. Sample Users (users)
    const seedUsers = [
      { name: "You (Admin)", roleId: adminRoleId },
      { name: "Rahul", roleId: memberRoleId },
      { name: "Priya", roleId: memberRoleId },
      { name: "Amit", roleId: memberRoleId },
    ];

    const userIds: (string | number)[] = [];
    for (const u of seedUsers) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .ilike("user_name", u.name)
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        userIds.push(existingUser[0].id);
      } else {
        const { data: newUser } = await supabase
          .from("users")
          .insert([{ user_name: u.name, user_role_id: u.roleId, is_active: true }])
          .select();
        if (newUser && newUser[0]) {
          userIds.push(newUser[0].id);
        }
      }
    }

    // 4. Sample Group (split_group / spllit_group)
    let groupTableName = "split_group";
    let { data: existingGroups, error: groupCheckErr } = await supabase.from("split_group").select("*").limit(1);
    if (groupCheckErr && (groupCheckErr.message.includes("schema cache") || groupCheckErr.message.includes("does not exist"))) {
      groupTableName = "spllit_group";
      const fallback = await supabase.from("spllit_group").select("*").limit(1);
      existingGroups = fallback.data;
    }

    let groupId: string | number = 1;

    if (!existingGroups || existingGroups.length === 0) {
      const { data: newGroup } = await supabase
        .from(groupTableName)
        .insert([
          {
            group_name: "Goa Friends Trip 🌴",
            group_desc: "Weekend vacation with college gang",
            is_active: true,
          },
        ])
        .select();

      if (newGroup && newGroup[0]) {
        groupId = newGroup[0].id;
      }
    } else {
      groupId = existingGroups[0].id;
    }

    // 5. Ensure group_members has rows
    const { data: existingMembers } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId);

    if (!existingMembers || existingMembers.length === 0) {
      const validUsers = userIds.length > 0 ? userIds : [21];
      const equalPct = Number((100 / validUsers.length).toFixed(2));
      for (const uId of validUsers) {
        await supabase.from("group_members").insert([
          {
            group_id: groupId,
            user_id: uId,
            sharing_pct: equalPct,
            is_active: true,
          },
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database successfully initialized with 6-table schema data! 🎉",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
