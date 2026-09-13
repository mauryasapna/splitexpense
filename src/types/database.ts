export interface UserRole {
  id: string | number;
  user_role_name: string;
  user_role_desc?: string;
  is_active?: boolean | string;
}

export interface User {
  id: string | number;
  user_name: string;
  user_role_id?: string | number | null;
  is_active?: boolean | string;
  // Joined relation
  users_role?: UserRole;
}

export interface ExpenseCategory {
  id: string | number;
  exp_name: string;
  exp_desc?: string;
  is_active?: boolean | string;
  user_role_id?: string | number | null;
  // Joined relation
  users_role?: UserRole;
}

export interface SplitGroup {
  id: string | number;
  group_name: string;
  group_desc?: string;
  is_active?: boolean | string;
  // Joined relation / Aggregates
  members?: GroupMember[];
  total_expenses?: number;
}

export interface GroupMember {
  id: string | number;
  user_id: string | number;
  sharing_pct: number;
  group_id: string | number;
  is_active?: boolean | string;
  // Joined relations
  users?: User;
  split_group?: SplitGroup;
}

export interface ExpenseLog {
  id: string | number;
  expense_cat_id?: string | number | null;
  user_id?: string | number | null;
  timestamp?: string;
  exp_title: string;
  exp_desc?: string;
  exp_note?: string;
  exp_amount: number;
  split_group_id?: string | number | null;
  // Joined relations
  users?: User;
  expense_category?: ExpenseCategory;
  split_group?: SplitGroup;
}
