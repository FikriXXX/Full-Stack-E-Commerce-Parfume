"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function InvoicePage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: fetchErr } = await supabase
          .from("orders")
          .select("*, order_items(*), profiles(role)")
          .eq("id", id)
          .single();

        if (fetchErr || !data) {
          setError("Pesanan tidak ditemukan");
          setLoading(false);
          return;
        }

        const isOwner = data.user_id === user.id;
        const isAdmin = data.profiles?.role === "admin";

        if (!isOwner && !isAdmin) {
          setError("Akses Ditolak: Anda tidak berwenang melihat invoice ini.");
          setLoading(false);
          return;
        }

        setOrder(data);
        setLoading(false);

        if (searchParams.get("print") === "true") {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      } catch (err) {
        setError("Gagal memuat invoice");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, searchParams, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">Memuat Invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4 text-center">
        <div>
          <h1 className="text-xl font-semibold text-destructive">Gagal Memuat</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error || "Terjadi kesalahan"}</p>
        </div>
      </div>
    );
  }

  const subtotal = order.order_items?.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0) || 0;
  const shippingCost = Math.max(0, order.total_amount - subtotal);

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-8 shadow-sm print:max-w-full print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center border-b pb-6">
          <div>
            <h1 className="font-serif text-3xl tracking-wide text-neutral-900">Maison Parfum</h1>
            <p className="mt-1 text-xs text-muted-foreground">Premium Fragrance Collection</p>
            <p className="mt-2 text-xs text-muted-foreground">Jakarta, Indonesia | info@maisonparfum.com</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold tracking-wider text-neutral-800">INVOICE</h2>
            <p className="mt-1 text-xs font-mono text-muted-foreground">ID: #{order.id.slice(0, 8)}</p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">Tanggal: {formatDate(order.created_at)}</p>
            <div className="mt-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                order.status === "delivered" ? "bg-green-100 text-green-800" :
                order.status === "cancelled" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tujuan Pengiriman:</h3>
            <p className="mt-2 text-sm font-semibold text-neutral-800">{order.shipping_name}</p>
            <p className="text-xs text-neutral-600 font-medium">Tel: {order.shipping_phone}</p>
            <p className="mt-1 text-xs text-neutral-600 leading-relaxed font-medium">
              {order.shipping_address}<br />
              {order.shipping_city}, {order.shipping_province} {order.shipping_postal_code}
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Metode Pengiriman:</h3>
            <p className="mt-2 text-xs text-neutral-700 font-medium">Reguler / Cashless</p>
            {order.notes && (
              <div className="mt-3">
                <h4 className="text-[10px] uppercase text-muted-foreground font-bold">Catatan:</h4>
                <p className="text-xs text-neutral-600 font-medium italic">"{order.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wider text-neutral-600">
                <th className="pb-3">Produk</th>
                <th className="pb-3 text-center" style={{ width: "100px" }}>Harga</th>
                <th className="pb-3 text-center" style={{ width: "60px" }}>Qty</th>
                <th className="pb-3 text-right" style={{ width: "100px" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.order_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-4">
                    <p className="font-medium text-neutral-800">{item.product_name}</p>
                  </td>
                  <td className="py-4 text-center text-neutral-600">{formatPrice(item.product_price)}</td>
                  <td className="py-4 text-center font-medium text-neutral-800">{item.quantity}</td>
                  <td className="py-4 text-right font-medium text-neutral-800">{formatPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Separator className="mt-6" />

        {/* Sums */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2.5 text-sm">
            <div className="flex justify-between text-neutral-600 font-medium">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-600 font-medium">
              <span>Ongkos Kirim:</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-neutral-800">
              <span>Total Pembayaran:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground print:mt-8">
          <p className="font-medium">Terima kasih telah berbelanja di Maison Parfum.</p>
          <p className="mt-1">Invoice ini adalah bukti pembayaran yang sah.</p>
          <div className="mt-4 flex justify-center gap-2 print:hidden">
            <button
              onClick={() => window.open(`/invoice/${order.id}?print=true`, "_blank")}
              className="rounded-md bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cetak Invoice / Simpan PDF
            </button>
            <button
              onClick={() => router.back()}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
