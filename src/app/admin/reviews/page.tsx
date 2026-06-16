import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { DeleteReviewButton } from "./delete-review-button";

export default async function AdminReviewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reviews: any[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("*, user:profiles(full_name), product:products(name)")
      .order("created_at", { ascending: false });
    
    reviews = data || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }

  return (
    <div>
      <h1 className="font-serif text-2xl">Ulasan Produk</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kelola semua ulasan yang diberikan oleh pelanggan.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Pengguna</th>
              <th className="px-4 py-3 font-medium">Produk</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Komentar</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada ulasan.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {review.user?.full_name || "Pengguna Anonim"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    {review.product?.name || "Produk dihapus"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{review.rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[200px] max-w-[400px]">
                    <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                      {review.comment || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteReviewButton reviewId={review.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
