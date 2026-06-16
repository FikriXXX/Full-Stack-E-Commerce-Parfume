"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CartItem } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null; address: string | null; city: string | null; province: string | null; postal_code: string | null } | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: cartData }, { data: profileData }] = await Promise.all([
        supabase.from("carts").select("*, product:products(*)").eq("user_id", user.id),
        supabase.from("profiles").select("full_name, phone, address, city, province, postal_code").eq("id", user.id).single(),
      ]);
      setItems((cartData as CartItem[]) || []);
      setProfile(profileData);
    };
    fetchCart();
  }, [router]);

  const getItemPrice = (item: CartItem) => {
    if (!item.product) return 0;
    const price = item.product.discount_percent > 0
      ? item.product.price * (1 - item.product.discount_percent / 100)
      : item.product.price;
    return price * item.quantity;
  };

  const total = items.reduce((sum, item) => sum + getItemPrice(item), 0);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { toast.error("Silakan login"); setLoading(false); return; }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total,
        shipping_name: formData.get("name") as string,
        shipping_phone: formData.get("phone") as string,
        shipping_address: formData.get("address") as string,
        shipping_city: formData.get("city") as string,
        shipping_province: formData.get("province") as string,
        shipping_postal_code: formData.get("postal_code") as string,
        notes: formData.get("notes") as string,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Gagal membuat pesanan");
      setLoading(false);
      return;
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product?.name || "",
      product_price: item.product?.price || 0,
      quantity: item.quantity,
      subtotal: getItemPrice(item),
    }));

    await supabase.from("order_items").insert(orderItems);

    // Clear cart
    await supabase.from("carts").delete().eq("user_id", user.id);

    // Send WhatsApp notification
    const waMessage = encodeURIComponent(
      `Pesanan Baru!\n\nNama: ${formData.get("name")}\nTelepon: ${formData.get("phone")}\n\nProduk:\n${items.map((i) => `- ${i.product?.name} x${i.quantity}`).join("\n")}\n\nTotal: ${formatPrice(total)}\nAlamat: ${formData.get("address")}, ${formData.get("city")}`
    );

    toast.success("Pesanan berhasil dibuat!");
    window.open(`https://wa.me/6281234567890?text=${waMessage}`, "_blank");
    router.push("/dashboard/orders");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl">Checkout</h1>

      <form onSubmit={handleCheckout} className="mt-6 space-y-6" key={profile ? "loaded" : "loading"}>
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Data Pengiriman</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Penerima</Label>
              <Input id="name" name="name" required defaultValue={profile?.full_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input id="phone" name="phone" required defaultValue={profile?.phone || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Input id="address" name="address" required defaultValue={profile?.address || ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <Input id="city" name="city" required defaultValue={profile?.city || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Provinsi</Label>
              <Input id="province" name="province" required defaultValue={profile?.province || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Kode Pos</Label>
              <Input id="postal_code" name="postal_code" required defaultValue={profile?.postal_code || ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Input id="notes" name="notes" placeholder="Catatan untuk penjual" />
          </div>
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Ringkasan Pesanan</h2>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product?.name} x{item.quantity}</span>
              <span>{formatPrice(getItemPrice(item))}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading || items.length === 0}>
          {loading ? "Memproses..." : "Buat Pesanan & Kirim via WhatsApp"}
        </Button>
      </form>
    </div>
  );
}
