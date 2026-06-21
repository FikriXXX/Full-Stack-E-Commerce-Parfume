"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CartItem } from "@/lib/types";
import { useCart } from "@/components/cart-context";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CartPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("carts")
        .select("*, product:products(*)")
        .eq("user_id", user.id);

      if (cancelled) return;
      setItems((data as CartItem[]) || []);
      setLoading(false);
    }

    loadCart();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateQty = async (id: string, qty: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (qty < 1 || !user) return;
    
    await supabase.from("carts").update({ quantity: qty }).eq("id", id).eq("user_id", user.id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    refreshCart();
  };

  const removeItem = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Secure delete: Ensure we only delete items belonging to the authenticated user
    await supabase.from("carts").delete().eq("id", id).eq("user_id", user.id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item dihapus dari keranjang");
    refreshCart();
  };

  const getItemPrice = (item: CartItem) => {
    if (!item.product) return 0;
    const price = item.product.discount_percent > 0
      ? item.product.price * (1 - item.product.discount_percent / 100)
      : item.product.price;
    return price * item.quantity;
  };

  const total = items.reduce((sum, item) => sum + getItemPrice(item), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const productCount = items.length;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="mt-5 font-serif text-3xl">Keranjang Kosong</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Produk yang Anda pilih akan tampil di sini sebelum lanjut checkout.
          </p>
          <Button render={<Link href="/products" />} className="mt-7 bg-accent text-accent-foreground hover:bg-accent/90">
            Jelajahi Produk
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-accent">Shopping Bag</p>
          <h1 className="mt-1 font-serif text-3xl">Keranjang</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {productCount} produk, {totalItems} item
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="space-y-3">
          {items.map((item) => {
            const productPrice = item.product
              ? item.product.discount_percent > 0
                ? item.product.price * (1 - item.product.discount_percent / 100)
                : item.product.price
              : 0;

            return (
              <div key={item.id} className="group rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
                <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-4">
                  <Link href={item.product ? `/products/${item.product.slug}` : "/products"} className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={item.product?.images[0] || "/placeholder.svg"}
                      alt={item.product?.name || ""}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="112px"
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3 sm:block">
                      <div className="min-w-0">
                        <Link href={item.product ? `/products/${item.product.slug}` : "/products"} className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent sm:text-base">
                          {item.product?.name || "Produk tidak tersedia"}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {item.product?.brand && <p className="text-xs text-muted-foreground">{item.product.brand}</p>}
                          {item.product?.volume && <Badge variant="outline">{item.product.volume}</Badge>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-destructive sm:hidden" onClick={() => removeItem(item.id)} aria-label="Hapus item">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex w-fit items-center rounded-lg border border-border bg-background">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-r-none"
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-l-none"
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-muted-foreground">{formatPrice(productPrice)} / item</p>
                        <p className="mt-0.5 text-sm font-semibold sm:text-base">{formatPrice(getItemPrice(item))}</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon-sm" className="hidden text-muted-foreground hover:text-destructive sm:inline-flex" onClick={() => removeItem(item.id)} aria-label="Hapus item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24 sm:p-5">
          <h2 className="font-serif text-xl">Ringkasan</h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estimasi ongkir</span>
              <span className="text-muted-foreground">Di checkout</span>
            </div>
            <Separator />
            <div className="flex items-end justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-semibold">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-secondary/60 p-3">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Produk akan dikonfirmasi admin sebelum pengiriman. Pastikan jumlah dan alamat benar saat checkout.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Button className="h-10 w-full bg-accent text-accent-foreground hover:bg-accent/90" render={<Link href="/checkout" />}>
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full"
              onClick={async () => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  toast.error("Silakan login terlebih dahulu untuk melakukan pemesanan");
                  router.push("/login");
                  return;
                }
                const message = encodeURIComponent(
                  `Halo, saya ingin checkout:\n\n${items.map((i) => `- ${i.product?.name} x${i.quantity}`).join("\n")}\n\nTotal: ${formatPrice(total)}`
                );
                window.open(`https://wa.me/6281234567890?text=${message}`, "_blank");
              }}
            >
              Order via WhatsApp
            </Button>
          </div>

          <Button variant="ghost" className="mt-3 w-full" render={<Link href="/products" />}>
            Lanjut Belanja
          </Button>
        </aside>
      </div>
    </div>
  );
}
