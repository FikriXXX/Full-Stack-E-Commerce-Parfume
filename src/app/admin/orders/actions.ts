"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";

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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating order status:", updateError);
    return { error: "Gagal mengupdate status pesanan" };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function updateShipment(
  orderId: string,
  courier: string,
  trackingNumber: string
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  // Upsert shipment record
  const { error: shipmentError } = await supabase
    .from("shipments")
    .upsert(
      {
        order_id: orderId,
        courier,
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString(),
      },
      { onConflict: "order_id" }
    );

  if (shipmentError) {
    console.error("Error updating shipment:", shipmentError);
    return { error: "Gagal menyimpan data resi" };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function deleteOrder(orderId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  // Delete cascade: shipments → order_items → order
  const { error: shipmentError } = await supabase
    .from("shipments")
    .delete()
    .eq("order_id", orderId);

  if (shipmentError) {
    console.error("Error deleting shipment:", shipmentError);
    return { error: "Gagal menghapus data pengiriman" };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Error deleting order items:", itemsError);
    return { error: "Gagal menghapus item pesanan" };
  }

  const { error: orderError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (orderError) {
    console.error("Error deleting order:", orderError);
    return { error: "Gagal menghapus pesanan" };
  }

  revalidatePath("/admin/orders");
  return { success: true };
}
