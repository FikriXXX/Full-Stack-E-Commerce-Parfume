"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CheckoutInput = {
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  notes?: string;
  shipping_cost?: number;
};

export async function placeOrder(input: CheckoutInput) {
  const supabase = await createClient();

  // 1. Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Silakan login terlebih dahulu" };
  }

  // 2. Fetch cart items from DB (NEVER trust client-side total)
  const { data: cartItems, error: cartError } = await supabase
    .from("carts")
    .select("*, product:products(id, name, price, discount_percent, stock, status)")
    .eq("user_id", user.id);

  if (cartError || !cartItems || cartItems.length === 0) {
    return { error: "Keranjang belanja kosong atau gagal dimuat." };
  }

  // 3. Validate products and calculate total server-side
  for (const item of cartItems) {
    if (!item.product) {
      return { error: `Produk tidak ditemukan di keranjang.` };
    }
    if (item.product.status === "out_of_stock") {
      return { error: `Produk "${item.product.name}" sudah habis terjual.` };
    }
    if (item.product.stock < item.quantity) {
      return {
        error: `Stok "${item.product.name}" tidak mencukupi (tersedia: ${item.product.stock}).`,
      };
    }
  }

  // 4. Calculate total_amount SERVER-SIDE (prevents price tampering)
  const shippingCost = input.shipping_cost || 0;
  const serverTotal = cartItems.reduce((sum, item) => {
    const price =
      item.product.discount_percent > 0
        ? item.product.price * (1 - item.product.discount_percent / 100)
        : item.product.price;
    return sum + price * item.quantity;
  }, 0) + shippingCost;

  // 5. Create the order with server-calculated total
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: serverTotal,
      shipping_name: input.shipping_name,
      shipping_phone: input.shipping_phone,
      shipping_address: input.shipping_address,
      shipping_city: input.shipping_city,
      shipping_province: input.shipping_province,
      shipping_postal_code: input.shipping_postal_code,
      notes: input.notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("Error creating order:", orderError);
    return { error: "Gagal membuat pesanan. Silakan coba lagi." };
  }

  // 6. Create order items
  const orderItems = cartItems.map((item) => {
    const price =
      item.product.discount_percent > 0
        ? item.product.price * (1 - item.product.discount_percent / 100)
        : item.product.price;
    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product.name,
      product_price: price,
      quantity: item.quantity,
      subtotal: price * item.quantity,
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    // Rollback: delete the created order
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("Error creating order items:", itemsError);
    return { error: "Gagal menyimpan detail pesanan." };
  }

  // 7. Clear the user's cart
  await supabase.from("carts").delete().eq("user_id", user.id);

  revalidatePath("/dashboard/orders");

  return {
    success: true,
    orderId: order.id,
    total: serverTotal,
    items: cartItems.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
    })),
    shipping: {
      name: input.shipping_name,
      phone: input.shipping_phone,
      address: input.shipping_address,
      city: input.shipping_city,
    },
  };
}
