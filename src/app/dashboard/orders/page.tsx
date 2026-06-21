"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Menunggu Pembayaran", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pembayaran Diterima", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Sedang Diproses", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Dikirim", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Selesai", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: XCircle },
};

const trackingSteps = ["pending", "paid", "processing", "shipped", "delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, product:products(images)), shipment:shipments(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground">Memuat...</p>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 font-serif text-xl">Belum Ada Pesanan</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pesanan Anda akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl">Riwayat Pesanan</h1>
      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const config = statusConfig[order.status];
          const currentStep = trackingSteps.indexOf(order.status);

          return (
            <Card key={order.id} className="cursor-pointer p-4 hover:bg-secondary/30 transition-colors" onClick={() => setSelected(order)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)} &middot; #{order.id.slice(0, 8)}
                  </p>
                  <p className="mt-1 font-medium">{formatPrice(order.total_amount)}</p>
                </div>
                <Badge className={config.color}>{config.label}</Badge>
              </div>

              {order.order_items && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {order.order_items.length} produk
                </p>
              )}

              {/* Tracking Timeline */}
              {order.status !== "cancelled" && (
                <div className="mt-3 flex items-center gap-1">
                  {trackingSteps.map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${i <= currentStep ? "bg-accent" : "bg-secondary"}`} />
                      {i < trackingSteps.length - 1 && (
                        <div className={`h-0.5 w-6 sm:w-10 ${i < currentStep ? "bg-accent" : "bg-secondary"}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Pesanan #{selected?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={statusConfig[selected.status].color}>
                  {statusConfig[selected.status].label}
                </Badge>
                <p className="text-xs text-muted-foreground">{formatDate(selected.created_at)}</p>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h3 className="text-sm font-medium">Produk Dipesan</h3>
                <div className="mt-2 space-y-3">
                  {selected.order_items?.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                        {(item as unknown as { product: { images: string[] } | null }).product?.images?.[0] && (
                          <img src={(item as unknown as { product: { images: string[] } }).product.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex flex-1 justify-between">
                        <div>
                          <p className="text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity} &middot; {formatPrice(item.product_price)}</p>
                        </div>
                        <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-medium text-sm">
                  <span>Total</span>
                  <span>{formatPrice(selected.total_amount)}</span>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full bg-secondary/50 hover:bg-secondary border-border text-foreground text-xs font-medium cursor-pointer"
                  onClick={() => window.open(`/invoice/${selected.id}?print=true`, "_blank")}
                >
                  Unduh Invoice (PDF)
                </Button>
              </div>

              <Separator />

              {/* Shipping Info */}
              <div>
                <h3 className="text-sm font-medium">Alamat Pengiriman</h3>
                <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
                  <p>{selected.shipping_name}</p>
                  <p>{selected.shipping_phone}</p>
                  <p>{selected.shipping_address}</p>
                  <p>{selected.shipping_city}, {selected.shipping_province} {selected.shipping_postal_code}</p>
                </div>
              </div>

              {/* Resi */}
              {selected.shipment && selected.shipment.tracking_number && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Info Pengiriman</h3>
                    <div className="mt-2 rounded-md bg-secondary/50 p-3">
                      <p className="text-sm">Kurir: {selected.shipment.courier}</p>
                      <p className="text-sm">No. Resi: {selected.shipment.tracking_number}</p>
                      <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" render={
                        <a href={`https://cekresi.com/?noresi=${selected.shipment.tracking_number}`} target="_blank" rel="noopener noreferrer" />
                      }>
                        Cek Resi
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {selected.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Catatan</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{selected.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
