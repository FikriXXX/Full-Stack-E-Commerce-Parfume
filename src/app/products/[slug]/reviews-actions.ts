"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(productId: string, rating: number, comment: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Silakan login terlebih dahulu" };
    }

    // Upsert the review (update if exists, insert if new)
    const { error } = await supabase
      .from("reviews")
      .upsert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      }, { onConflict: "user_id,product_id" });

    if (error) {
      console.error("Error submitting review:", error);
      return { error: "Gagal menyimpan ulasan" };
    }

    revalidatePath(`/products/[slug]`, "page");
    return { success: true };
  } catch (error) {
    return { error: "Terjadi kesalahan sistem" };
  }
}
