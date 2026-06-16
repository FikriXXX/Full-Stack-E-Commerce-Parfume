import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductActions } from "./actions";
import { ProductCard } from "@/components/product-card";
import { ChevronRight, PackageCheck, Sparkles, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductReviews } from "./product-reviews";

type Params = Promise<{ slug: string }>;

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  let product;
  let related: Product[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("slug", slug)
      .single();
    product = data;

    if (product) {
      const { data: rel } = await supabase
        .from("products")
        .select("*, category:categories(*), reviews(rating)")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);
      related = (rel as Product[]) || [];
    }
  } catch {
    notFound();
  }

  if (!product) notFound();

  const discountedPrice =
    product.discount_percent > 0
      ? product.price * (1 - product.discount_percent / 100)
      : product.price;
  const stockLabel =
    product.status === "ready"
      ? "Ready Stock"
      : product.status === "preorder"
        ? "Pre-order"
        : "Stok Habis";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Katalog</span>
        <ChevronRight className="h-3 w-3" />
        {product.category && (
          <>
            <span>{product.category.name}</span>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:gap-12">
        {/* Images */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary sm:aspect-square">
            <Image
              src={product.images[0] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.discount_percent > 0 && (
              <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">
                Hemat {product.discount_percent}%
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {product.images.slice(0, 5).map((img: string, i: number) => (
                <div
                  key={i}
                  className={`relative aspect-square overflow-hidden rounded-md bg-secondary ${
                    i === 0 ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  <Image src={img} alt={i === 0 ? product.name : ""} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col lg:pt-2">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {product.category && <span>{product.category.name}</span>}
              {product.category && product.brand && <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />}
              {product.brand && <span>{product.brand}</span>}
            </div>

            <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={product.status === "ready" ? "default" : "outline"} className={product.status === "out_of_stock" ? "text-destructive" : ""}>
                {stockLabel}
              </Badge>
              {product.volume && <Badge variant="outline">{product.volume}</Badge>}
              <Badge variant="outline">Stok {product.stock}</Badge>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold tracking-tight">{formatPrice(discountedPrice)}</p>
              {product.discount_percent > 0 && (
                <p className="pb-1 text-sm text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Harga belum termasuk ongkir. Checkout lewat keranjang atau WhatsApp.
            </p>
          </div>

          {/* Description */}
          <div className="mt-6 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-medium">Deskripsi</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {product.description || "Belum ada deskripsi produk."}
              </p>
            </div>

            {product.aroma_notes && (
              <div>
                <Separator />
                <div className="mt-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-medium">Aroma Notes</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {product.aroma_notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
            <ProductActions product={product as Product} discountedPrice={discountedPrice} />
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-accent">Masih satu kategori</p>
              <h2 className="mt-1 font-serif text-2xl">Produk Terkait</h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
