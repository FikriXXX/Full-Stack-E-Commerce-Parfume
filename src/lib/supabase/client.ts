import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your_supabase")) {
    // During build on some platforms (like Vercel), env vars might be missing if not configured correctly.
    // Returning a dummy client or a silent warning instead of throwing helps avoid build crashes
    // on pages that are intended to be client-only or dynamic.
    console.warn("Supabase credentials missing. Client initialization skipped.");
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
