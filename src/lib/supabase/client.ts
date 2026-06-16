import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your_supabase")) {
    throw new Error("Supabase not configured");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
