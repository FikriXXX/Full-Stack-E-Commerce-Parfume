"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trash2, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/types";
import { updateOrderStatus, updateShipment, deleteOrder } from "./actions";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const printShippingLabel = (order: Order) => {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    toast.error("Gagal membuka jendela cetak. Pastikan pop-up diizinkan.");
    return;
  }

  const itemsHtml = order.order_items
    ?.map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 6px 0; font-size: 11px;">${item.product_name}</td>
        <td style="padding: 6px 0; text-align: center; font-size: 11px; font-weight: bold;">x${item.quantity}</td>
      </tr>
    `
    )
    .join("");

  const trackingText = order.shipment?.tracking_number || "Belum ada resi";

  const htmlContent = `
    <html>
      <head>
        <title>Label Pengiriman #${order.id.slice(0, 8)}</title>
        <style>
          @page {
            size: A6;
            margin: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 15px;
            color: #000;
            background-color: #fff;
            box-sizing: border-box;
          }
          .label-container {
            border: 2px dashed #000;
            padding: 12px;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }
          .header {
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo {
            font-family: serif;
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background: #000;
            color: #fff;
            padding: 2px 6px;
            border-radius: 3px;
          }
          .section {
            display: flex;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .col {
            flex: 1;
          }
          .col-left {
            border-right: 1px solid #000;
            padding-right: 10px;
          }
          .col-right {
            padding-left: 10px;
          }
          .label-title {
            font-size: 9px;
            text-transform: uppercase;
            color: #666;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .phone {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .address {
            font-size: 11px;
            line-height: 1.3;
          }
          .expedition-info {
            display: flex;
            justify-content: center;
            text-align: center;
            background: #f3f4f6;
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
          }
          .tracking-num {
            font-size: 14px;
            font-family: monospace;
            font-weight: bold;
          }
          .order-details {
            flex: 1;
            font-size: 10px;
          }
          .order-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .order-details th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            font-size: 9px;
            text-transform: uppercase;
            color: #555;
          }
          .footer-note {
            border-top: 1px solid #000;
            padding-top: 6px;
            margin-top: 8px;
            font-size: 9px;
            text-align: center;
            color: #555;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <span class="logo">Maison Parfum</span>
            <span class="title">LABEL PENGIRIMAN</span>
          </div>
          
          <div class="expedition-info">
            <div>
              <div class="label-title">No. Resi / Order ID</div>
              <div class="tracking-num">${trackingText !== "Belum ada resi" ? trackingText : `#${order.id.slice(0, 8)}`}</div>
            </div>
          </div>

          <div class="section">
            <div class="col col-left">
              <div class="label-title">Penerima:</div>
              <div class="name">${order.shipping_name || "-"}</div>
              <div class="phone">${order.shipping_phone || "-"}</div>
              <div class="address">
                ${order.shipping_address || "-"}, ${order.shipping_city || "-"}, ${order.shipping_province || "-"} ${order.shipping_postal_code || ""}
              </div>
            </div>
            <div class="col col-right" style="max-width: 40%;">
              <div class="label-title">Pengirim:</div>
              <div class="name" style="font-size: 12px;">Maison Parfum</div>
              <div class="phone">0812-3456-7890</div>
              <div class="address" style="font-size: 9px;">Jakarta, Indonesia</div>
            </div>
          </div>

          <div class="order-details">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Daftar Barang</th>
                  <th style="width: 50px; text-align: center;">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || `<tr><td colspan="2" style="text-align: center; padding: 10px;">Tidak ada item</td></tr>`}
              </tbody>
            </table>
            ${order.notes ? `<div style="margin-top: 6px; font-size: 9px;"><strong>Catatan:</strong> ${order.notes}</div>` : ""}
          </div>

          <div class="footer-note">
            Terima kasih telah berbelanja di Maison Parfum!
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchOrders = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(images)), shipment:shipments(*), profiles(full_name, phone)")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, product:products(images)), shipment:shipments(*), profiles(full_name, phone)")
        .order("created_at", { ascending: false });
      if (!cancelled) setOrders((data as Order[]) || []);
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = (orderId: string) => {
    if (!confirm("Hapus pesanan ini? Detail produk dan resi terkait juga akan terhapus.")) return;

    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pesanan berhasil dihapus");
        fetchOrders();
        if (selected?.id === orderId) setSelected(null);
      }
    });
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status diubah ke ${status}`);
        fetchOrders();
        if (selected?.id === orderId) setSelected({ ...selected, status });
      }
    });
  };

  const handleUpdateShipment = (e: React.FormEvent<HTMLFormElement>, orderId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("tracking_number") as string;

    startTransition(async () => {
      const result = await updateShipment(orderId, courier, trackingNumber);
      if (result.error) {
        toast.error(result.error);
      } else {
        await updateOrderStatus(orderId, "shipped");
        toast.success("Resi berhasil diinput");
        fetchOrders();
        setSelected(null);
      }
    });
  };

  const getStatusCount = (status: string) => {
    if (!status) return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = !filter || o.id.toLowerCase().includes(filter.toLowerCase()) || o.shipping_name?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="font-serif text-2xl">Pesanan</h1>

      {/* Filters */}
      <div className="mt-4 space-y-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari ID atau nama..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          <Button
            variant={statusFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("")}
            className="rounded-full text-xs font-medium"
          >
            Semua ({getStatusCount("")})
          </Button>
          {statuses.map((s) => {
            const displayLabel = s.charAt(0).toUpperCase() + s.slice(1);
            const count = getStatusCount(s);
            return (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="rounded-full text-xs font-medium"
              >
                {displayLabel} ({count})
              </Button>
            );
          })}
        </div>
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
                  className="text-muted-foreground hover:text-accent"
                  onClick={() => printShippingLabel(order)}
                  aria-label="Cetak alamat"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(order.id)}
                  aria-label="Hapus pesanan"
                  disabled={isPending}
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
                      onClick={() => handleUpdateStatus(selected.id, s)}
                      disabled={isPending}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input Resi */}
              <form onSubmit={(e) => handleUpdateShipment(e, selected.id)} className="space-y-2">
                <Label>Input Resi</Label>
                <div className="flex gap-2">
                  <Input name="courier" placeholder="Kurir (JNE, J&T, dll)" required defaultValue={selected.shipment?.courier || ""} disabled={isPending} />
                  <Input name="tracking_number" placeholder="No. Resi" required defaultValue={selected.shipment?.tracking_number || ""} disabled={isPending} />
                </div>
                <Button type="submit" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Resi"}
                </Button>
              </form>

              <div className="border-t border-border pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full bg-accent/10 border-accent/20 hover:bg-accent/20 text-accent font-medium animate-in fade-in duration-200 cursor-pointer"
                  onClick={() => printShippingLabel(selected)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Alamat / Label Pengiriman (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-secondary/50 hover:bg-secondary border-border text-foreground font-medium cursor-pointer"
                  onClick={() => window.open(`/invoice/${selected.id}?print=true`, "_blank")}
                >
                  Unduh Invoice (PDF)
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(selected.id)}
                  disabled={isPending}
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
