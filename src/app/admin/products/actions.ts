"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Product } from "@/lib/types";

// Helper: verify caller is admin
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Tidak terautentikasi" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase, user, error: "Akses ditolak: bukan admin" };
  }
  return { supabase, user, error: null };
}

export async function saveProduct(
  productData: Omit<Product, "id" | "created_at" | "updated_at" | "category" | "reviews">,
  editingId?: string
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  if (editingId) {
    const { error: updateError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", editingId);
    if (updateError) {
      console.error("Error updating product:", updateError);
      return { error: "Gagal mengupdate produk" };
    }
  } else {
    const { error: insertError } = await supabase
      .from("products")
      .insert(productData);
    if (insertError) {
      console.error("Error inserting product:", insertError);
      return { error: "Gagal menambah produk: " + insertError.message };
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    console.error("Error deleting product:", deleteError);
    return { error: "Gagal menghapus produk" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}
