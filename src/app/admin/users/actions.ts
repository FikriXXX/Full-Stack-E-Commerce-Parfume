"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleUserRole(userId: string, currentRole: string) {
  try {
    const supabase = await createClient();
    
    // Check if the user making the request is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return { error: "Unauthorized" };
    }

    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error, data } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating role:", error);
      return { error: "Failed to update role" };
    }

    if (!data || data.length === 0) {
      return { error: "Update diblokir oleh Database (RLS Policy). Pastikan Anda sudah menjalankan SQL Policy untuk Admin." };
    }

    revalidatePath("/admin/users");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/", "layout");
    return { success: true, newRole };
  } catch (error) {
    return { error: "An unexpected error occurred" };
  }
}
