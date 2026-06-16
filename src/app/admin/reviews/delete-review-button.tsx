"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteReview } from "./actions";

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) return;

    setIsDeleting(true);
    const result = await deleteReview(reviewId);
    
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Ulasan berhasil dihapus.");
      // No need to set isDeleting to false since the component will unmount
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon-sm" 
      className="text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label="Hapus ulasan"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
