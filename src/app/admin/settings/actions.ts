"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Allowed setting keys (whitelist to prevent arbitrary key injection)
const ALLOWED_SETTING_KEYS = [
  "store_name",
  "store_description",
  "whatsapp",
  "email",
  "address",
  "open_hours",
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
] as const;

type SettingKey = (typeof ALLOWED_SETTING_KEYS)[number];

export async function saveStoreSettings(
  settings: Partial<Record<SettingKey, string>>
) {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Akses ditolak: bukan admin" };
  }

  // Only save whitelisted keys
  const upsertData = ALLOWED_SETTING_KEYS.filter(
    (key) => key in settings
  ).map((key) => ({
    key,
    value: settings[key] ?? "",
  }));

  for (const item of upsertData) {
    const { error } = await supabase
      .from("store_settings")
      .upsert(item, { onConflict: "key" });
    if (error) {
      console.error("Error saving setting:", item.key, error);
      return { error: `Gagal menyimpan pengaturan: ${item.key}` };
    }
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
