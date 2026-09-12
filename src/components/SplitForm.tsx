"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserRole,
  User,
  ExpenseCategory,
  SplitGroup,
  GroupMember,
  ExpenseLog,
} from "@/types/database";

interface LocalMember {
  id: string;
  name: string;
  color: string;
  pct: number;
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-fuchsia-500",
];

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: "1", exp_name: "Food & Dining 🍔", exp_desc: "Restaurants, Cafes, Zomato", is_active: true },
  { id: "2", exp_name: "Travel & Fuel ✈️", exp_desc: "Flights, Train, Uber, Petrol", is_active: true },
  { id: "3", exp_name: "Rent & Stay 🏠", exp_desc: "Hotel, Airbnb, Flat Rent", is_active: true },
  { id: "4", exp_name: "Party & Drinks 🎉", exp_desc: "Clubbing, Drinks, Events", is_active: true },
  { id: "5", exp_name: "Groceries 🛒", exp_desc: "Supermarket, Blinkit, Instamart", is_active: true },
  { id: "6", exp_name: "Bills & Utilities ⚡", exp_desc: "WiFi, Electricity, Water", is_active: true },
];

export default function SplitForm() {
  // Navigation Active Tab
  const [activeTab, setActiveTab] = useState<"split" | "groups" | "categories" | "db_explorer">("split");

  // Database State from REST APIs
  const [dbRoles, setDbRoles] = useState<UserRole[]>([]);
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbCategories, setDbCategories] = useState<ExpenseCategory[]>([]);
  const [dbGroups, setDbGroups] = useState<SplitGroup[]>([]);
  const [dbGroupMembers, setDbGroupMembers] = useState<GroupMember[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);

  // Explorer active table subtab
  const [explorerTable, setExplorerTable] = useState<
    "expense_log" | "group_members" | "split_group" | "users" | "users_role" | "expense_category"
  >("expense_log");

  // Split Form Inputs
  const [selectedGroupId, setSelectedGroupId] = useState<string>("custom");
  const [groupName, setGroupName] = useState("Goa Friends Trip 🌴");
  const [groupDesc, setGroupDesc] = useState("Weekend chill & party");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState<string>("");
  const [selectedCatId, setSelectedCatId] = useState<string | number>("");
  const [expDesc, setExpDesc] = useState("");
  const [expNote, setExpNote] = useState("");
  const [currency] = useState("₹");

  // Dynamic Members in current split
  const [members, setMembers] = useState<LocalMember[]>([
    { id: "1", name: "You (Admin)", color: "bg-violet-500", pct: 33.33 },
    { id: "2", name: "Rahul", color: "bg-emerald-500", pct: 33.33 },
    { id: "3", name: "Priya", color: "bg-pink-500", pct: 33.34 },
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [payerId, setPayerId] = useState<string>("1");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // New Category / User Form states
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<string | number>("");

  // Create Group Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupDesc, setCreateGroupDesc] = useState("");
  const [createGroupMembers, setCreateGroupMembers] = useState<
    { name: string; pct: number; user_id?: string | number }[]
  >([
    { name: "You (Admin)", pct: 50 },
    { name: "Rahul", pct: 50 },
  ]);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Load all 6 tables from Node.js REST APIs
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [resRoles, resUsers, resCats, resGroups, resGMs, resLogs] = await Promise.all([
        fetch("/api/roles").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/users").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/categories").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/groups").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/group-members").then((r) => r.json()).catch(() => ({ data: [] })),
        fetch("/api/expenses").then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (resRoles.data) setDbRoles(resRoles.data);
      if (resUsers.data) setDbUsers(resUsers.data);

      if (resCats.data && resCats.data.length > 0) {
        setDbCategories(resCats.data);
        setSelectedCatId(resCats.data[0].id);
      } else {
        setDbCategories(DEFAULT_CATEGORIES);
        setSelectedCatId(DEFAULT_CATEGORIES[0].id);
      }

      if (resGroups.data) setDbGroups(resGroups.data);
      if (resGMs.data) setDbGroupMembers(resGMs.data);
      if (resLogs.data) setExpenseLogs(resLogs.data);
    } catch (err: unknown) {
      console.error("Error loading REST data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Seed database
  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setToastMessage(json.message || "Database seeded successfully!");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 4000);
        await loadAllData();
      } else {
        setErrorMessage(json.error || "Failed to seed database");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMessage(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Group selection switch
  const handleSelectGroup = (gId: string) => {
    setSelectedGroupId(gId);
    if (gId === "custom") {
      setGroupName("New Split Group");
      setGroupDesc("");
      return;
    }
    const found = dbGroups.find((g) => g.id.toString() === gId);
    if (found) {
      setGroupName(found.group_name);
      setGroupDesc(found.group_desc || "");
      if (found.members && found.members.length > 0) {
        const loadedMembers: LocalMember[] = found.members.map((m, idx) => ({
          id: m.users?.id?.toString() || m.user_id.toString(),
          name: m.users?.user_name || `Member ${m.user_id}`,
          color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          pct: Number(m.sharing_pct) || Number((100 / found.members!.length).toFixed(2)),
        }));
        setMembers(loadedMembers);
        setPayerId(loadedMembers[0]?.id || "1");
      }
    }
  };

  // Member Management
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const trimmed = newMemberName.trim();
    if (members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("This member is already in the list!");
      return;
    }

    const newId = Date.now().toString();
    const color = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
    const newCount = members.length + 1;
    const equalPct = Number((100 / newCount).toFixed(2));

    const updated = [...members.map((m) => ({ ...m, pct: equalPct })), { id: newId, name: trimmed, color, pct: equalPct }];
    setMembers(updated);
    setNewMemberName("");
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 2) {
      alert("At least 2 members are required to split a bill!");
      return;
    }
    const filtered = members.filter((m) => m.id !== id);
    const equalPct = Number((100 / filtered.length).toFixed(2));
    const updated = filtered.map((m) => ({ ...m, pct: equalPct }));
    setMembers(updated);
    if (payerId === id && updated.length > 0) {
      setPayerId(updated[0].id);
    }
  };

  // Calculations for Live Settlement (Exact Paisa Precision)
  const numericAmount = parseFloat(expAmount) || 0;
  const count = Math.max(1, members.length);

  const calculateShares = () => {
    if (splitMode === "equal") {
      const totalPaise = Math.round(numericAmount * 100);
      const basePaise = Math.floor(totalPaise / count);
      const remainderPaise = totalPaise % count;

      return members.map((m, i) => {
        const paisa = basePaise + (i < remainderPaise ? 1 : 0);
        const amount = Number((paisa / 100).toFixed(2));
        const pct = numericAmount > 0 ? Number(((amount / numericAmount) * 100).toFixed(1)) : Number((100 / count).toFixed(1));
        const isPayer = m.id === payerId;
        const net = isPayer ? Number((numericAmount - amount).toFixed(2)) : -amount;
        return { ...m, amount, pct, isPayer, net };
      });
    } else {
      // Custom percentage
      return members.map((m) => {
        const amount = Number(((numericAmount * (m.pct || 0)) / 100).toFixed(2));
        const isPayer = m.id === payerId;
        const net = isPayer ? Number((numericAmount - amount).toFixed(2)) : -amount;
        return { ...m, amount, pct: m.pct, isPayer, net };
      });
    }
  };

  const breakdown = calculateShares();
  const currentPayer = members.find((m) => m.id === payerId) || members[0];

  // Save Expense & Sync via Node.js REST API
  const handleSaveToDatabase = async () => {
    if (!expTitle.trim()) {
      alert("Please enter an Expense Title (e.g. Dinner, Uber, Hotel)");
      return;
    }
    if (numericAmount <= 0) {
      alert("Please enter a valid Total Amount");
      return;
    }
    if (members.length < 2) {
      alert("Please add at least 2 members to split the expense!");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      // 1. Ensure Group in `split_group` via /api/groups
      let groupId: string | number | null = null;
      const groupExists = dbGroups.some((g) => g.id.toString() === selectedGroupId.toString());
      if (selectedGroupId !== "custom" && groupExists) {
        groupId = selectedGroupId;
      } else {
        const grpRes = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group_name: groupName.trim() || "Friends Split",
            group_desc: groupDesc.trim() || expDesc || "Group expense",
            members: members.map((m) => ({ name: m.name, pct: m.pct })),
          }),
        });
        const grpJson = await grpRes.json();
        if (grpRes.ok && grpJson.data) {
          groupId = grpJson.data.id;
        }
      }

      // 2. Identify/Create Payer User in `users`
      let payerUserId: string | number | null = null;
      const payerName = currentPayer?.name?.trim() || "You (Admin)";
      const existingUser = dbUsers.find((u) => u.user_name.toLowerCase() === payerName.toLowerCase());

      if (existingUser) {
        payerUserId = existingUser.id;
      } else {
        const uRes = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_name: payerName }),
        });
        const uJson = await uRes.json();
        if (uRes.ok && uJson.data) {
          payerUserId = uJson.data.id;
        }
      }

      // 3. Post to /api/expenses (`expense_log`)
      const selectedCat = dbCategories.find((c) => c.id.toString() === selectedCatId.toString());
      const payload = {
        exp_title: expTitle.trim(),
        exp_desc: expDesc.trim(),
        exp_note: expNote.trim() || `Split among ${members.map((m) => m.name).join(", ")}`,
        exp_amount: numericAmount,
        expense_cat_id: selectedCat?.id || null,
        user_id: payerUserId,
        split_group_id: groupId,
        timestamp: new Date().toISOString(),
      };

      const expRes = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const expJson = await expRes.json();
      if (!expRes.ok) {
        throw new Error(expJson.error || expJson.details || "Failed to insert into expense_log");
      }

      setToastMessage("Expense successfully logged in Database across all 6 tables! 🎉");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);

      // Reset form fields
      setExpTitle("");
      setExpAmount("");
      setExpDesc("");
      setExpNote("");

      await loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving expense";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete from expense_log
  const handleDeleteLog = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setExpenseLogs((prev) => prev.filter((l) => l.id !== id));
      } else {
        const json = await res.json();
        alert("Delete failed: " + json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create new category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exp_name: newCatName.trim(),
          exp_desc: newCatDesc.trim(),
          user_role_id: dbRoles[0]?.id || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setToastMessage(`Category "${newCatName}" created!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setNewCatName("");
        setNewCatDesc("");
        await loadAllData();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: newUserName.trim(),
          user_role_id: newUserRole || dbRoles[0]?.id || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setToastMessage(`User "${newUserName}" created!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setNewUserName("");
        await loadAllData();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group Management Functions
  const openNewGroupModal = () => {
    setCreateGroupName("");
    setCreateGroupDesc("");
    const defaultList =
      dbUsers.length >= 2
        ? dbUsers.slice(0, 3).map((u, _, arr) => ({
            name: u.user_name,
            user_id: u.id,
            pct: Number((100 / arr.length).toFixed(2)),
          }))
        : [
            { name: "You (Admin)", pct: 50 },
            { name: "Rahul", pct: 50 },
          ];
    setCreateGroupMembers(defaultList);
    setShowCreateGroupModal(true);
  };

  const handleAddMemberToNewGroup = () => {
    const newCount = createGroupMembers.length + 1;
    const equalPct = Number((100 / newCount).toFixed(2));
    const availableUser = dbUsers.find(
      (u) => !createGroupMembers.some((m) => m.name.toLowerCase() === u.user_name.toLowerCase())
    );
    const newMemberName = availableUser ? availableUser.user_name : `Friend ${newCount}`;
    const newMemberId = availableUser ? availableUser.id : undefined;

    setCreateGroupMembers([
      ...createGroupMembers.map((m) => ({ ...m, pct: equalPct })),
      { name: newMemberName, user_id: newMemberId, pct: equalPct },
    ]);
  };

  const handleRemoveMemberFromNewGroup = (index: number) => {
    if (createGroupMembers.length <= 1) {
      alert("A group must have at least 1 member!");
      return;
    }
    const filtered = createGroupMembers.filter((_, i) => i !== index);
    const equalPct = Number((100 / filtered.length).toFixed(2));
    setCreateGroupMembers(filtered.map((m) => ({ ...m, pct: equalPct })));
  };

  const handleEqualizeNewGroupPcts = () => {
    const count = createGroupMembers.length;
    if (count === 0) return;
    const equalPct = Number((100 / count).toFixed(2));
    setCreateGroupMembers(createGroupMembers.map((m) => ({ ...m, pct: equalPct })));
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }
    if (createGroupMembers.length === 0) {
      alert("Please add at least one member");
      return;
    }

    try {
      setIsSubmittingGroup(true);
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: createGroupName.trim(),
          group_desc: createGroupDesc.trim(),
          members: createGroupMembers,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setToastMessage(`🎉 Group "${createGroupName}" created with ${createGroupMembers.length} members!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3500);
        setShowCreateGroupModal(false);
        setCreateGroupName("");
        setCreateGroupDesc("");
        await loadAllData();
      } else {
        alert(json.error || "Failed to create group");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      alert("Error creating group: " + msg);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleDeleteGroup = async (id: string | number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete group "${name}"?\nAll associated members in group_members and group expense logs will be cleaned up.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/groups?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setToastMessage(`Group "${name}" deleted!`);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        if (selectedGroupId.toString() === id.toString()) {
          setSelectedGroupId("custom");
          setGroupName("New Split Group");
        }
        await loadAllData();
      } else {
        alert("Failed to delete group: " + json.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      alert("Error deleting group: " + msg);
    }
  };

  const handleSelectGroupToSplit = (groupId: string | number) => {
    handleSelectGroup(groupId.toString());
    setActiveTab("split");
    setToastMessage("Switched to Split tab for this group!");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2000);
  };

  // WhatsApp share generator
  const generateShareText = () => {
    const selectedCat = dbCategories.find((c) => c.id.toString() === selectedCatId.toString());
    let msg = `💰 *SplitKaro Bill Summary*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 *Expense:* ${expTitle || "Bill"} (${selectedCat?.exp_name || "General"})\n`;
    msg += `👥 *Group:* ${groupName}\n`;
    msg += `💵 *Total Amount:* ${currency}${numericAmount.toFixed(2)}\n`;
    msg += `👑 *Paid by:* ${currentPayer?.name}\n\n`;
    msg += `📊 *Member Settlement Breakdown:*\n`;

    breakdown.forEach((item) => {
      if (item.isPayer) {
        msg += `• *${item.name}*: Receives back *${currency}${item.net.toFixed(2)}*\n`;
      } else {
        msg += `• *${item.name}*: Owes *${currency}${item.amount.toFixed(2)}* to ${currentPayer?.name}\n`;
      }
    });

    if (expNote) msg += `\n📝 *Note:* ${expNote}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⚡ Generated via SplitKaro Pro`;
    return msg;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // DDL matching the 6-table schema diagram
  const completeSqlSchema = `-- 1. users_role
CREATE TABLE IF NOT EXISTS users_role (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_role_name TEXT NOT NULL,
  user_role_desc TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_role_id BIGINT REFERENCES users_role(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- 3. expense_category
CREATE TABLE IF NOT EXISTS expense_category (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  exp_name TEXT NOT NULL,
  exp_desc TEXT,
  is_active BOOLEAN DEFAULT true,
  user_role_id BIGINT REFERENCES users_role(id) ON DELETE SET NULL
);

-- 4. split_group
CREATE TABLE IF NOT EXISTS split_group (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  group_name TEXT NOT NULL,
  group_desc TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 5. group_members
CREATE TABLE IF NOT EXISTS group_members (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  sharing_pct NUMERIC(5,2) DEFAULT 0,
  group_id BIGINT REFERENCES split_group(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true
);

-- 6. expense_log
CREATE TABLE IF NOT EXISTS expense_log (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  expense_cat_id BIGINT REFERENCES expense_category(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  exp_title TEXT NOT NULL,
  exp_desc TEXT,
  exp_note TEXT,
  exp_amount NUMERIC(10,2) NOT NULL,
  split_group_id BIGINT REFERENCES split_group(id) ON DELETE CASCADE
);

-- Enable RLS & Public Policies
ALTER TABLE users_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_users_role" ON users_role FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_expense_category" ON expense_category FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_split_group" ON split_group FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_expense_log" ON expense_log FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(completeSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-400/50">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-bold text-sm">{toastMessage}</p>
            <p className="text-xs text-emerald-100">Database updated across relational tables.</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="text-xs hover:underline font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("split")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "split"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>⚡</span> Split & Log Expense
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "groups"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>👥</span> Groups & Members ({dbGroups.length})
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "categories"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>🏷️</span> Categories & Roles
          </button>

          <button
            onClick={() => setActiveTab("db_explorer")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === "db_explorer"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>🗄️</span> 6-Table DB Explorer
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="px-3 py-1.5 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 text-xs font-semibold flex items-center gap-1.5"
            title="Seed sample data across all 6 tables"
          >
            <span>🌱</span> {isSeeding ? "Seeding..." : "Seed Database"}
          </button>
          <button
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1"
          >
            <span>📜</span> SQL Schema
          </button>
        </div>
      </div>

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 text-white border border-zinc-700 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>📜</span> PostgreSQL DDL Script (6-Table Architecture)
              </h3>
              <button onClick={() => setShowSqlModal(false)} className="text-zinc-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-300">
              Run this in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to create/verify all 6 relational tables with clean foreign keys and public policies:
            </p>
            <pre className="p-4 rounded-xl bg-black font-mono text-[11px] text-emerald-400 overflow-x-auto border border-zinc-800 leading-relaxed max-h-72">
              {completeSqlSchema}
            </pre>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={handleCopySql}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                {copiedSql ? "✅ Copied to Clipboard!" : "📋 Copy SQL DDL"}
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SPLIT BILL & ADD EXPENSE */}
      {activeTab === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Input Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>⚡</span> Split & Log Expense
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Real-time equal or custom splits synced directly to PostgreSQL via REST APIs
                </p>
              </div>
              <button
                onClick={loadAllData}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1"
              >
                <span>🔄</span> {isLoading ? "Syncing..." : "Sync"}
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Group Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Select Split Group (`split_group`)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleSelectGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="custom">+ Create New Group</option>
                    {dbGroups.map((g) => (
                      <option key={g.id} value={g.id.toString()}>
                        {g.group_name} ({g.members?.length || 0} members)
                      </option>
                    ))}
                  </select>

                  {selectedGroupId === "custom" && (
                    <input
                      type="text"
                      placeholder="Group Name (e.g. Goa Trip)"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  )}
                </div>
              </div>

              {/* 2. Expense Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Expense Title (`exp_title`) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Seafood Dinner at Brittos 🦀"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Amount (`exp_amount`) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Category Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Category (`expense_category`)
                </label>
                <div className="flex flex-wrap gap-2">
                  {dbCategories.map((cat) => {
                    const isSelected = selectedCatId.toString() === cat.id.toString();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-violet-600 border-violet-600 text-white shadow-xs"
                            : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-violet-400"
                        }`}
                      >
                        {cat.exp_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Split Mode Switch */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Group Members (`group_members`) ({members.length})
                  </label>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSplitMode("equal")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        splitMode === "equal" ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-xs" : "text-zinc-500"
                      }`}
                    >
                      Equal Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode("custom")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        splitMode === "custom" ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-xs" : "text-zinc-500"
                      }`}
                    >
                      Custom %
                    </button>
                  </div>
                </div>

                {/* Member Chips & Sharing % */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${m.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white">{m.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {splitMode === "custom" ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={m.pct}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setMembers((prev) => prev.map((item) => (item.id === m.id ? { ...item, pct: val } : item)));
                              }}
                              className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-center"
                            />
                            <span className="text-xs text-zinc-400">%</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-zinc-400">
                            {currency}{((numericAmount * m.pct) / 100).toFixed(2)} ({m.pct}%)
                          </span>
                        )}

                        {members.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-zinc-400 hover:text-rose-500 text-xs p-1"
                            title="Remove member"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add member form */}
                <form onSubmit={handleAddMember} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="+ Add friend's name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-violet-600 text-white font-bold text-xs transition"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* 5. Who Paid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Paid In Full By (`user_id`)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {members.map((m) => {
                    const isPayer = payerId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayerId(m.id)}
                        className={`p-2 rounded-xl text-left border flex items-center gap-2 transition ${
                          isPayer
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                            : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md ${m.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold truncate">{m.name}</span>
                        {isPayer && <span className="ml-auto text-xs">👑</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Expense Description & Note */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Expense Description (`exp_desc`)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Butter Chicken, 4 Naan, Cold Drinks"
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Note / Reference (`exp_note`)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via GPay UPI #98765"
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  disabled={isSaving}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? "⏳ Logging to Database..." : "⚡ Save Expense to PostgreSQL Database"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Settlement Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-zinc-800 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Live Settlement Math
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                  {dbCategories.find((c) => c.id.toString() === selectedCatId.toString())?.exp_name || "General"}
                </span>
              </div>

              <div className="mb-6">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-1">
                  <span className="text-violet-400 font-medium">{currency}</span>
                  <span>{numericAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Paid in full by <strong className="text-zinc-200">{currentPayer?.name}</strong> for {groupName}
                </p>
              </div>

              {/* Proportion Bar */}
              {numericAmount > 0 && (
                <div className="mb-6 space-y-1.5">
                  <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    {breakdown.map((item) => (
                      <div
                        key={item.id}
                        style={{ width: `${Math.max(0, item.pct)}%` }}
                        className={`${item.color} transition-all duration-300`}
                        title={`${item.name}: ${item.pct}%`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Breakdown List */}
              <div className="space-y-2.5 mb-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Individual Balances:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {breakdown.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 backdrop-blur-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-white text-xs font-bold shadow-xs`}>
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            {item.name}
                            {item.isPayer && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-md font-normal">
                                👑 Payer
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Share: {currency}{item.amount.toFixed(2)} ({item.pct}%)
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {item.isPayer ? (
                          <div className="text-xs font-bold text-emerald-400">
                            + {currency}{item.net.toFixed(2)}
                            <div className="text-[10px] text-zinc-400 font-normal">receives back</div>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-rose-400">
                            - {currency}{item.amount.toFixed(2)}
                            <div className="text-[10px] text-zinc-400 font-normal">owes {currentPayer?.name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>💬</span> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span>📋</span> {copiedShare ? "Copied! 🎉" : "Copy Summary"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS & MEMBERS */}
      {activeTab === "groups" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Groups (`split_group`) &amp; Members (`group_members`)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Manage group memberships, assigned sharing percentages, and track aggregate group totals.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewGroupModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition active:scale-95 shrink-0"
            >
              <span>➕</span> Create New Group
            </button>
          </div>

          {dbGroups.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="text-4xl">🏝️</div>
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Groups Found</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Create a new group with members and split percentages to start tracking and settling shared expenses.
              </p>
              <button
                type="button"
                onClick={openNewGroupModal}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition"
              >
                + Create First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbGroups.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-4 hover:border-violet-500/50 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {g.group_name}
                        </h4>
                        {g.group_desc && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{g.group_desc}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                          #{g.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(g.id, g.group_name)}
                          title="Delete Group"
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 transition text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Total Spending:</span>
                      <span className="text-xs font-black text-violet-600 dark:text-violet-400">
                        ₹{Number(g.total_expenses || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Members ({g.members?.length || 0}):
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {(g.members || []).map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 bg-white/50 dark:bg-zinc-900/50 px-2.5 py-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {m.users?.user_name || `User #${m.user_id}`}
                            </span>
                            <span className="text-violet-600 dark:text-violet-400 font-bold text-[11px]">{m.sharing_pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => handleSelectGroupToSplit(g.id)}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-violet-600 dark:hover:bg-violet-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <span>⚡</span> Split Bill for this Group
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CREATE GROUP MODAL */}
          {showCreateGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white">Create New Split Group</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Group Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manali Friends Trip 🏔️ or Flatmates 302"
                      value={createGroupName}
                      onChange={(e) => setCreateGroupName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Group Description (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vacation expenses, food & hotel bills"
                      value={createGroupDesc}
                      onChange={(e) => setCreateGroupDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  {/* Group Members Builder */}
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Group Members &amp; Sharing % (`group_members`)
                      </label>
                      <button
                        type="button"
                        onClick={handleEqualizeNewGroupPcts}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        ⚖️ Equalize %
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {createGroupMembers.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60"
                        >
                          <input
                            type="text"
                            required
                            placeholder="Member Name"
                            value={m.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCreateGroupMembers(
                                createGroupMembers.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-medium"
                          />

                          <div className="flex items-center gap-1 w-24">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={m.pct}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCreateGroupMembers(
                                  createGroupMembers.map((item, i) => (i === idx ? { ...item, pct: val } : item))
                                );
                              }}
                              className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-right text-zinc-900 dark:text-white font-bold"
                            />
                            <span className="text-xs text-zinc-400 font-bold">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromNewGroup(idx)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 flex items-center justify-center text-xs transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        onClick={handleAddMemberToNewGroup}
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                      >
                        + Add Another Member
                      </button>

                      {(() => {
                        const totalPct = createGroupMembers.reduce((acc, m) => acc + (Number(m.pct) || 0), 0);
                        const isValid = Math.abs(totalPct - 100) < 0.1;
                        return (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isValid
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            Total: {totalPct.toFixed(1)}% {isValid ? "✓" : "(Should be 100%)"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateGroupModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingGroup}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {isSubmittingGroup ? "Saving to DB..." : "💾 Save Group (`split_group`)"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORIES & ROLES */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Categories Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>🏷️</span> Expense Categories (`expense_category`)
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {dbCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-white">{c.exp_name}</div>
                    {c.exp_desc && <div className="text-[11px] text-zinc-400">{c.exp_desc}</div>}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    ID #{c.id}
                  </span>
                </div>
              ))}
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                placeholder="New Category Name (e.g. Movies & Cinema 🍿)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Description"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition"
              >
                + Add Category
              </button>
            </form>
          </div>

          {/* Users & Roles Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>👤</span> Users (`users`) &amp; Roles (`users_role`)
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {dbUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">
                      {u.user_name.charAt(0)}
                    </span>
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">{u.user_name}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {u.users_role?.user_role_name || "Member"}
                  </span>
                </div>
              ))}
            </div>

            {/* Add User Form */}
            <form onSubmit={handleCreateUser} className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <input
                type="text"
                placeholder="New User Name (e.g. Sara)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-violet-600 text-white font-bold text-xs transition"
              >
                + Add User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: 6-TABLE DATABASE EXPLORER */}
      {activeTab === "db_explorer" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>🗄️</span> Real-time 6-Table PostgreSQL Schema Explorer
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Inspect raw data and relational joins across all 6 tables.
              </p>
            </div>
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold flex items-center gap-1.5"
            >
              <span>🔄</span> {isLoading ? "Refreshing..." : "Refresh Tables"}
            </button>
          </div>

          {/* Sub-Tabs for the 6 Tables */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "expense_log", label: "1. expense_log", count: expenseLogs.length },
              { id: "group_members", label: "2. group_members", count: dbGroupMembers.length },
              { id: "split_group", label: "3. split_group", count: dbGroups.length },
              { id: "users", label: "4. users", count: dbUsers.length },
              { id: "users_role", label: "5. users_role", count: dbRoles.length },
              { id: "expense_category", label: "6. expense_category", count: dbCategories.length },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setExplorerTable(t.id as typeof explorerTable)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  explorerTable === t.id
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table Data View */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {explorerTable === "expense_log" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Expense Name (`exp_title`)</th>
                    <th className="p-3">Description (`exp_desc`)</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Payer (user_id)</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Note</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {expenseLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{l.id}</td>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-white">{l.exp_title}</td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-300">{l.exp_desc || "-"}</td>
                      <td className="p-3 font-bold text-violet-600 dark:text-violet-400">₹{Number(l.exp_amount).toFixed(2)}</td>
                      <td className="p-3">{l.users?.user_name || `User #${l.user_id}`}</td>
                      <td className="p-3">{l.expense_category?.exp_name || `Cat #${l.expense_cat_id}`}</td>
                      <td className="p-3">{l.split_group?.group_name || `Group #${l.split_group_id}`}</td>
                      <td className="p-3 text-zinc-400 text-[11px]">{l.exp_note || "-"}</td>
                      <td className="p-3 text-zinc-400 text-[11px]">{l.timestamp ? new Date(l.timestamp).toLocaleDateString() : "-"}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteLog(l.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                          title="Delete Expense"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTable === "group_members" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Group (`group_id`)</th>
                    <th className="p-3">User (`user_id`)</th>
                    <th className="p-3">Sharing %</th>
                    <th className="p-3">Is Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbGroupMembers.map((gm) => (
                    <tr key={gm.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{gm.id}</td>
                      <td className="p-3 font-semibold">{gm.split_group?.group_name || `Group #${gm.group_id}`}</td>
                      <td className="p-3">{gm.users?.user_name || `User #${gm.user_id}`}</td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{gm.sharing_pct}%</td>
                      <td className="p-3">{String(gm.is_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTable === "split_group" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Group Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Members Count</th>
                    <th className="p-3">Total Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbGroups.map((g) => (
                    <tr key={g.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{g.id}</td>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-white">{g.group_name}</td>
                      <td className="p-3 text-zinc-400">{g.group_desc || "-"}</td>
                      <td className="p-3">{g.members?.length || 0}</td>
                      <td className="p-3 font-bold text-violet-600">₹{Number(g.total_expenses || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTable === "users" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Role (`user_role_id`)</th>
                    <th className="p-3">Is Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{u.id}</td>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-white">{u.user_name}</td>
                      <td className="p-3">{u.users_role?.user_role_name || (u.user_role_id ? `Role #${u.user_role_id}` : "Member")}</td>
                      <td className="p-3">{String(u.is_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTable === "users_role" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Role Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Is Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbRoles.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{r.id}</td>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-white">{r.user_role_name}</td>
                      <td className="p-3 text-zinc-400">{r.user_role_desc || "-"}</td>
                      <td className="p-3">{String(r.is_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTable === "expense_category" && (
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Category Name</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Role Access (`user_role_id`)</th>
                    <th className="p-3">Is Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {dbCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-3 font-mono font-bold">#{c.id}</td>
                      <td className="p-3 font-semibold text-zinc-900 dark:text-white">{c.exp_name}</td>
                      <td className="p-3 text-zinc-400">{c.exp_desc || "-"}</td>
                      <td className="p-3">{c.users_role?.user_role_name || (c.user_role_id ? `Role #${c.user_role_id}` : "Public")}</td>
                      <td className="p-3">{String(c.is_active)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
