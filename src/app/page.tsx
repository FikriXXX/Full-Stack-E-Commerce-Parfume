import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { HeroSlider } from "@/components/hero-slider";
import { createClient } from "@/lib/supabase/server";
import type { Product, Category } from "@/lib/types";

async function getHomeData() {
  try {
    const supabase = await createClient();
    const [{ data: featuredProducts }, { data: categories }, { data: banners }] = await Promise.all([
      supabase.from("products").select("*, category:categories(*), reviews(rating)").eq("is_featured", true).limit(6),
      supabase.from("categories").select("*").limit(5),
      supabase.from("banners").select("image_url").order("sort_order"),
    ]);
    return {
      featuredProducts: (featuredProducts as Product[]) || [],
      categories: (categories as Category[]) || [],
      bannerImages: (banners || []).map((b: { image_url: string }) => b.image_url),
    };
  } catch {
    return { featuredProducts: [], categories: [], bannerImages: [] };
  }
}

export default async function HomePage() {
  const { featuredProducts, bannerImages } = await getHomeData();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-32">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent" />
                New Collection 2026
              </div>
              <h1 className="mt-4 sm:mt-6 font-serif text-3xl leading-[1.1] sm:text-4xl md:text-5xl lg:text-6xl">
                Temukan Aroma
                <span className="block text-accent">Signature Anda</span>
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-base leading-relaxed text-muted-foreground">
                Koleksi parfum premium dari brand ternama. Setiap botol menyimpan
                cerita dan karakter yang unik untuk menemani setiap momen Anda.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-6" render={<Link href="/products" />}>
                  Jelajahi Koleksi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="h-11 px-6" render={<Link href="/products?category=exclusive" />}>
                  Exclusive Collection
                </Button>
              </div>
              {/* Mini stats */}
              <div className="mt-8 sm:mt-12 flex gap-6 sm:gap-8 border-t border-border pt-6 sm:pt-8">
                <div>
                  <p className="text-xl sm:text-2xl font-semibold">50+</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Produk Premium</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold">1000+</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Happy Customer</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-semibold">100%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Original</p>
                </div>
              </div>
            </div>

            {/* Model Image Slider */}
            <div className="relative order-1 lg:order-2">
              <div className="absolute -inset-4 rounded-2xl bg-accent/5 hidden lg:block" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <HeroSlider images={bannerImages} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-border">
            <div className="flex items-center gap-4 sm:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">100% Original</p>
                <p className="text-xs text-muted-foreground">Dijamin keasliannya</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Truck className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Pengiriman Cepat</p>
                <p className="text-xs text-muted-foreground">1-2 hari kerja</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <ShieldCheck className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Garansi Resmi</p>
                <p className="text-xs text-muted-foreground">Tukar jika tidak sesuai</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-accent">Pilihan Terbaik</p>
              <h2 className="mt-1 sm:mt-2 font-serif text-2xl sm:text-3xl">Produk Unggulan</h2>
            </div>
            <Button variant="ghost" size="sm" render={<Link href="/products" />}>
              <span className="hidden sm:inline">Lihat Semua</span>
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="mt-6 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-foreground px-6 py-10 text-center sm:px-16 sm:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 to-transparent" />
          <div className="relative">
            <h2 className="font-serif text-2xl text-background sm:text-3xl">
              Butuh Rekomendasi Parfum?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-background/70">
              Tim kami siap membantu Anda menemukan parfum yang sempurna.
              Konsultasi gratis via WhatsApp.
            </p>
            <Button className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-6" render={<a href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20konsultasi%20parfum" target="_blank" rel="noopener noreferrer" />}>
              Chat WhatsApp Sekarang
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
