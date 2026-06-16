"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteReview(reviewId: string) {
  try {
    const supabase = await createClient();
    
    // Auth check is handled by Supabase RLS (only admins can delete)
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
      return { error: "Gagal menghapus ulasan. Pastikan Anda memiliki akses Admin." };
    }

    // Revalidate the admin reviews page and the specific product page if we knew the slug, 
    // but we'll revalidate the whole products path to be safe.
    revalidatePath("/admin/reviews");
    revalidatePath("/products/[slug]", "page");
    return { success: true };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem." };
  }
}
