"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string) {
  try {
    const supabase = await createClient();

    // 1. Defense-in-depth: Verify user is admin manually before relying on RLS
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
      return { error: "Akses ditolak: Hanya admin yang dapat menghapus ulasan." };
    }

    // 2. Perform the deletion
    const { error, data } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .select();

    if (error) {
      console.error("Error deleting review:", error);
      return { error: "Gagal menghapus ulasan." };
    }

    if (!data || data.length === 0) {
      return {
        error: "Gagal menghapus ulasan. Ulasan tidak ditemukan.",
      };
    }

    revalidatePath("/admin/reviews");
    revalidatePath("/products/[slug]", "page");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting review:", error);
    return { error: "Terjadi kesalahan sistem." };
  }
}
