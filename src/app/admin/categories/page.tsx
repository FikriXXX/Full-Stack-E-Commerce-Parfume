"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const fetchData = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    setCategories((data as Category[]) || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const name = formData.get("name") as string;
    const catData = {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.get("description") as string,
    };

    if (editing) {
      await supabase.from("categories").update(catData).eq("id", editing.id);
      toast.success("Kategori diupdate");
    } else {
      await supabase.from("categories").insert(catData);
      toast.success("Kategori ditambahkan");
    }
    setDialogOpen(false);
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Kategori dihapus");
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Kategori</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-accent text-accent-foreground text-sm font-medium h-7 gap-1 px-2.5 hover:bg-accent/90">
            <Plus className="h-4 w-4" />Tambah
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Tambah"} Kategori</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" name="name" required defaultValue={editing?.name || ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" name="description" defaultValue={editing?.description || ""} />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(cat); setDialogOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
