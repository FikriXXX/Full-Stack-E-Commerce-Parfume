"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitReview } from "./reviews-actions";

export function ReviewForm({ productId, initialRating = 0, initialComment = "" }: { productId: string, initialRating?: number, initialComment?: string }) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Silakan berikan rating bintang terlebih dahulu.");
      return;
    }

    setLoading(true);
    const result = await submitReview(productId, rating, comment);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Terima kasih! Ulasan Anda berhasil disimpan.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <Label className="text-sm font-medium">Beri Rating</Label>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-medium">Ulasan Anda (Opsional)</Label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
        {loading ? "Menyimpan..." : "Kirim Ulasan"}
      </Button>
    </form>
  );
}
