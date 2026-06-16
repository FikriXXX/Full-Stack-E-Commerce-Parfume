import { createClient } from "@/lib/supabase/server";
import { Star, MessageSquare } from "lucide-react";
import { ReviewForm } from "./review-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Review } from "@/lib/types";

export async function ProductReviews({ productId }: { productId: string }) {
  const supabase = await createClient();

  // Fetch reviews
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("*, user:profiles(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData as Review[]) || [];

  // Check auth and purchase status
  const { data: { user } } = await supabase.auth.getUser();
  let canReview = false;
  let userReview: Review | undefined;

  if (user) {
    // Has the user reviewed it already?
    userReview = reviews.find((r) => r.user_id === user.id);

    // Has the user ordered it?
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order:orders(user_id, status)")
      .eq("product_id", productId);

    if (orderItems && orderItems.length > 0) {
      // Check if any of these order items belong to an order placed by the user
      // and ideally not cancelled. We'll accept any non-cancelled order for now.
      canReview = orderItems.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) =>
          item.order?.user_id === user.id && item.order?.status !== "cancelled"
      );
    }
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-accent">Ulasan Pelanggan</p>
          <h2 className="mt-1 font-serif text-2xl">Penilaian Produk</h2>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-sm font-medium">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{averageRating}</span>
            <span className="text-muted-foreground">({reviews.length} ulasan)</span>
          </div>
        )}
      </div>

      {canReview && (
        <ReviewForm 
          productId={productId} 
          initialRating={userReview?.rating} 
          initialComment={userReview?.comment || ""} 
        />
      )}

      <div className="mt-8 space-y-6">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Belum ada ulasan untuk produk ini.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={review.user?.avatar_url || ""} />
                    <AvatarFallback>{review.user?.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{review.user?.full_name || "Pengguna"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    &quot;{review.comment}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
