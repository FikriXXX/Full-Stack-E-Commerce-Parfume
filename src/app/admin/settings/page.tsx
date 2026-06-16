"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("store_settings").select("*");
      const map: Record<string, string> = {};
      data?.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
      setSettings(map);
    };
    fetch();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const keys = ["store_name", "store_description", "whatsapp", "email", "address", "open_hours", "instagram", "tiktok", "facebook", "twitter"];

    for (const key of keys) {
      const value = (formData.get(key) as string) || "";
      await supabase.from("store_settings").upsert({ key, value }, { onConflict: "key" });
    }

    toast.success("Pengaturan berhasil disimpan");
    setLoading(false);
  };

  return (
    <div>
      <h1 className="font-serif text-2xl">Pengaturan Toko</h1>
      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Store Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Informasi Toko</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store_name">Nama Toko</Label>
              <Input id="store_name" name="store_name" defaultValue={settings.store_name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">No. WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp || ""} placeholder="+62812..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_description">Deskripsi Toko</Label>
            <Input id="store_description" name="store_description" defaultValue={settings.store_description || ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" defaultValue={settings.email || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="open_hours">Jam Operasional</Label>
              <Input id="open_hours" name="open_hours" defaultValue={settings.open_hours || ""} placeholder="Senin - Sabtu, 09:00 - 18:00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" defaultValue={settings.address || ""} />
          </div>
        </div>

        <Separator />

        {/* Social Media */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Sosial Media</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" name="instagram" defaultValue={settings.instagram || ""} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input id="tiktok" name="tiktok" defaultValue={settings.tiktok || ""} placeholder="https://tiktok.com/@..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" name="facebook" defaultValue={settings.facebook || ""} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input id="twitter" name="twitter" defaultValue={settings.twitter || ""} placeholder="https://x.com/..." />
            </div>
          </div>
        </div>

        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>
    </div>
  );
}
