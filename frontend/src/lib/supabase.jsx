import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tqecfestnsfmuntpmdtj.supabase.co";
const supabaseAnonKey = "sb_publishable_LaHLBiOhRgb6edD1ViNREw_n27m8lyQ";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);