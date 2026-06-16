"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MessageCircle, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductActions({
  product,
  discountedPrice,
}: {
  product: Product;
  discountedPrice: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const maxQty = Math.max(1, product.stock);

  const addToCart = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    const { error } = await supabase.from("carts").upsert(
      { user_id: user.id, product_id: product.id, quantity: qty },
      { onConflict: "user_id,product_id" }
    );

    if (error) {
      toast.error("Gagal menambahkan ke keranjang");
    } else {
      toast.success("Ditambahkan ke keranjang");
    }
  };

  const orderWhatsApp = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk melakukan pemesanan");
      router.push("/login");
      return;
    }

    const message = encodeURIComponent(
      `Halo, saya ingin memesan:\n\n` +
        `Produk: ${product.name}\n` +
        `Jumlah: ${qty}\n` +
        `Harga: ${formatPrice(discountedPrice * qty)}\n\n` +
        `Mohon informasi selanjutnya. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Quantity */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Jumlah</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total {formatPrice(discountedPrice * qty)}</p>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-background">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={product.stock === 0 || qty <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-12 text-center text-sm font-medium">{qty}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            disabled={product.stock === 0 || qty >= product.stock}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid gap-3">
        <Button
          className="h-10 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={addToCart}
          disabled={product.stock === 0}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Tambah ke Keranjang
        </Button>
      </div>

      <Button
        variant="outline"
        className="h-10 w-full"
        onClick={orderWhatsApp}
        disabled={product.stock === 0}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Order via WhatsApp
      </Button>
      {product.stock === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Produk sedang habis, cek produk terkait atau hubungi admin untuk info restock.
        </p>
      )}
    </div>
  );
}
