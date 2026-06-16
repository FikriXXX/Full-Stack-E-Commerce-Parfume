"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = async () => {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select("*, order_items(*, product:products(images)), shipment:shipments(*), profiles(full_name, phone)")
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    const { data } = await query;
    setOrders((data as Order[]) || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("*, order_items(*, product:products(images)), shipment:shipments(*), profiles(full_name, phone)")
        .order("created_at", { ascending: false });

      if (statusFilter) query = query.eq("status", statusFilter);
      const { data } = await query;
      if (!cancelled) setOrders((data as Order[]) || []);
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Hapus pesanan ini? Detail produk dan resi terkait juga akan terhapus.")) return;

    const supabase = createClient();
    const { error: shipmentError } = await supabase.from("shipments").delete().eq("order_id", orderId);

    if (shipmentError) {
      toast.error("Gagal menghapus resi: " + shipmentError.message);
      return;
    }

    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId);

    if (itemsError) {
      toast.error("Gagal menghapus item pesanan: " + itemsError.message);
      return;
    }

    const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId);

    if (orderError) {
      toast.error("Gagal menghapus pesanan: " + orderError.message);
      return;
    }

    toast.success("Pesanan berhasil dihapus");
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    if (selected?.id === orderId) setSelected(null);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error("Gagal update status: " + error.message);
      return;
    }
    toast.success(`Status diubah ke ${status}`);
    fetchOrders();
    if (selected?.id === orderId) setSelected({ ...selected, status });
  };

  const updateShipment = async (e: React.FormEvent<HTMLFormElement>, orderId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    await supabase.from("shipments").upsert({
      order_id: orderId,
      courier: formData.get("courier") as string,
      tracking_number: formData.get("tracking_number") as string,
      shipped_at: new Date().toISOString(),
    }, { onConflict: "order_id" });

    await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
    toast.success("Resi berhasil diinput");
    fetchOrders();
    setSelected(null);
  };

  const filteredOrders = filter
    ? orders.filter((o) => o.id.includes(filter) || o.shipping_name?.toLowerCase().includes(filter.toLowerCase()))
    : orders;

  return (
    <div>
      <h1 className="font-serif text-2xl">Pesanan</h1>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari ID atau nama..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Orders List */}
      <div className="mt-6 space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-4 hover:bg-secondary/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs">#{order.id.slice(0, 8)}</p>
                <p className="text-sm font-medium">{order.shipping_name || "-"}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(order.total_amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="text-right" onClick={() => setSelected(order)}>
                  <Badge variant="outline">{order.status}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("id-ID")}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteOrder(order.id)}
                  aria-label="Hapus pesanan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Detail Pesanan #{selected?.id.slice(0, 8)}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm">
                <p><strong>Nama:</strong> {selected.shipping_name}</p>
                <p><strong>Telepon:</strong> {selected.shipping_phone}</p>
                <p><strong>Alamat:</strong> {selected.shipping_address}, {selected.shipping_city}, {selected.shipping_province} {selected.shipping_postal_code}</p>
                {selected.notes && <p><strong>Catatan:</strong> {selected.notes}</p>}
              </div>

              {/* Items */}
              {selected.order_items && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Produk:</p>
                  {selected.order_items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                        {(item as unknown as { product: { images: string[] } | null }).product?.images?.[0] && (
                          <img src={(item as unknown as { product: { images: string[] } }).product.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <p>{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <p>{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                  <p className="font-medium pt-1">Total: {formatPrice(selected.total_amount)}</p>
                </div>
              )}

              {/* Update Status */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="flex flex-wrap gap-1">
                  {statuses.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Resi */}
              <form onSubmit={(e) => updateShipment(e, selected.id)} className="space-y-2">
                <Label>Input Resi</Label>
                <div className="flex gap-2">
                  <Input name="courier" placeholder="Kurir (JNE, J&T, dll)" required defaultValue={selected.shipment?.courier || ""} />
                  <Input name="tracking_number" placeholder="No. Resi" required defaultValue={selected.shipment?.tracking_number || ""} />
                </div>
                <Button type="submit" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Simpan Resi
                </Button>
              </form>

              <div className="border-t border-border pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => deleteOrder(selected.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Pesanan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
