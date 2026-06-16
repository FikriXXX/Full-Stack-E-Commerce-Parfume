"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import type { WishlistItem, Product } from "@/lib/types";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("wishlist")
        .select("*, product:products(*, category:categories(*))")
        .eq("user_id", user.id);
      setItems((data as WishlistItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const removeItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from("wishlist").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Dihapus dari wishlist");
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-12"><p className="text-center text-muted-foreground">Memuat...</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl">Wishlist Kosong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Belum ada produk di wishlist Anda.</p>
        <Button render={<Link href="/products" />} className="mt-6">
          Jelajahi Produk
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl">Wishlist</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <ProductCard product={item.product as Product} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-background/80"
              onClick={() => removeItem(item.id)}
            >
              <Heart className="h-4 w-4 fill-current text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
