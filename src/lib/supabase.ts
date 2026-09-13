import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.URL ||
  "https://chtljjiwbxiuwdtccwyo.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.PUBLISHABLE ||
  "sb_publishable_GPJfBVKqQsB-tA86yoBfPg_draFuYRJ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
