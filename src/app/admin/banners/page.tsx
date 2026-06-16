"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Banner = { id: string; image_url: string; sort_order: number };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners((data as Banner[]) || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const supabase = createClient();

    for (let i = 0; i < files.length; i++) {
      const dataUrl = await fileToDataUrl(files[i]);
      const { error } = await supabase.from("banners").insert({
        image_url: dataUrl,
        sort_order: banners.length + i,
      });
      if (error) {
        toast.error("Gagal: " + error.message);
        setUploading(false);
        return;
      }
    }

    toast.success("Banner berhasil ditambahkan");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    fetchBanners();
  };

  const removeBanner = async (id: string) => {
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Banner dihapus");
    fetchBanners();
  };

  return (
    <div>
      <h1 className="font-serif text-2xl">Banner Hero</h1>
      <p className="mt-1 text-sm text-muted-foreground">Foto model yang tampil bergulir di landing page</p>

      <div className="mt-6">
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Mengupload..." : "Pilih File Gambar"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">Bisa pilih beberapa file. Rekomendasi ukuran kecil (maks 500KB per file).</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {banners.map((banner) => (
          <div key={banner.id} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
            <img src={banner.image_url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => removeBanner(banner.id)}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada banner. Upload gambar di atas.</p>
      )}
    </div>
  );
}
