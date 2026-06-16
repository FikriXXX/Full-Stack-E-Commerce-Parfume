import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({ product }: { product: Product }) {
  const discountedPrice =
    product.discount_percent > 0
      ? product.price * (1 - product.discount_percent / 100)
      : product.price;

  const reviews = product.reviews || [];
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-secondary">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.discount_percent > 0 && (
          <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">
            -{product.discount_percent}%
          </Badge>
        )}
        {product.status === "preorder" && (
          <Badge variant="outline" className="absolute right-2 top-2 bg-background/80">
            Pre-order
          </Badge>
        )}
      </div>
      <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{product.brand}</p>
        <h3 className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">{product.name}</h3>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{averageRating}</span>
            <span className="text-muted-foreground font-normal">({reviews.length})</span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <p className="text-xs sm:text-sm font-medium">{formatPrice(discountedPrice)}</p>
          {product.discount_percent > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
