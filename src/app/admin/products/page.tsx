"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Product, Category } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const supabase = createClient();
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*, category:categories(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    setProducts((prods as Product[]) || []);
    setCategories((cats as Category[]) || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const supabase = createClient();
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*, category:categories(*)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*"),
      ]);
      if (cancelled) return;
      setProducts((prods as Product[]) || []);
      setCategories((cats as Category[]) || []);
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedImages = await Promise.all(files.map(fileToDataUrl));
      setImageUrls((current) => [...current, ...uploadedImages]);
      toast.success(`${files.length} gambar berhasil ditambahkan`);
    } catch {
      toast.error("Gagal membaca file gambar");
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const productData = {
      name: formData.get("name") as string,
      slug: (formData.get("name") as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.get("description") as string,
      price: parseInt(formData.get("price") as string),
      discount_percent: parseInt(formData.get("discount_percent") as string) || 0,
      stock: parseInt(formData.get("stock") as string) || 0,
      brand: formData.get("brand") as string,
      aroma_notes: formData.get("aroma_notes") as string,
      volume: formData.get("volume") as string,
      status: formData.get("status") as string,
      category_id: formData.get("category_id") as string || null,
      is_featured: formData.get("is_featured") === "on",
      images: imageUrls,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(productData).eq("id", editing.id);
      if (error) toast.error("Gagal mengupdate produk");
      else toast.success("Produk berhasil diupdate");
    } else {
      const { error } = await supabase.from("products").insert(productData);
      if (error) toast.error("Gagal menambah produk: " + error.message);
      else toast.success("Produk berhasil ditambahkan");
    }

    setDialogOpen(false);
    setEditing(null);
    setImageUrls([]);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produk dihapus");
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Produk</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); setImageUrls([]); } }}>
          <DialogTrigger onClick={() => { setEditing(null); setImageUrls([]); }} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-accent text-accent-foreground text-sm font-medium h-7 gap-1 px-2.5 hover:bg-accent/90">
            <Plus className="h-4 w-4" />Tambah Produk
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-3" key={editing?.id || "new"}>
              <div className="space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" name="name" required defaultValue={editing?.name || ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" name="description" defaultValue={editing?.description || ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input id="price" name="price" type="number" required defaultValue={editing?.price || ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="discount_percent">Diskon (%)</Label>
                  <Input id="discount_percent" name="discount_percent" type="number" defaultValue={editing?.discount_percent || 0} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="stock">Stok</Label>
                  <Input id="stock" name="stock" type="number" defaultValue={editing?.stock || 0} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={editing?.brand || ""} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="volume">Volume</Label>
                  <Input id="volume" name="volume" defaultValue={editing?.volume || ""} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="aroma_notes">Aroma Notes</Label>
                <Input id="aroma_notes" name="aroma_notes" defaultValue={editing?.aroma_notes || ""} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="category_id">Kategori</Label>
                  <select id="category_id" name="category_id" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue={editing?.category_id || ""}>
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select id="status" name="status" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue={editing?.status || "ready"}>
                    <option value="ready">Ready</option>
                    <option value="preorder">Pre-order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Gambar Produk</Label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadingImages}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadingImages ? "Mengupload..." : "Pilih Gambar dari Galeri"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Bisa pilih beberapa gambar. Gambar pertama akan jadi thumbnail produk.
                </p>
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {imageUrls.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-md bg-secondary">
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-background/85 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                          aria-label="Hapus gambar"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_featured" name="is_featured" defaultChecked={editing?.is_featured || false} />
                <Label htmlFor="is_featured">Produk Unggulan</Label>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {editing ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4">Produk</th>
              <th className="pb-2 pr-4">Harga</th>
              <th className="pb-2 pr-4">Stok</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {product.images[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">{formatPrice(product.price)}</td>
                <td className="py-3 pr-4">{product.stock}</td>
                <td className="py-3 pr-4">
                  <Badge variant="outline">{product.status}</Badge>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(product); setImageUrls(product.images || []); setDialogOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
