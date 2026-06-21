"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CartItem } from "@/lib/types";
import { placeOrder } from "./actions";
import { useCart } from "@/components/cart-context";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<{
    full_name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
  } | null>(null);

  // Shipping cost states
  const [provinces, setProvinces] = useState<{ province_id: string; province: string }[]>([]);
  const [cities, setCities] = useState<{ city_id: string; city_name: string; type: string; postal_code: string }[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingEtd, setShippingEtd] = useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: cartData }, { data: profileData }] = await Promise.all([
        supabase
          .from("carts")
          .select("*, product:products(*)")
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("full_name, phone, address, city, province, postal_code")
          .eq("id", user.id)
          .single(),
      ]);
      setItems((cartData as CartItem[]) || []);
      setProfile(profileData);
    };
    fetchCart();

    const fetchProvinces = async () => {
      try {
        const res = await fetch("/api/shipping/provinces");
        const result = await res.json();
        if (result.success) {
          setProvinces(result.data);
        }
      } catch (err) {
        console.error("Gagal memuat provinsi:", err);
      }
    };
    fetchProvinces();
  }, [router]);

  const calculateShipping = async (cityId: string, courier: string) => {
    if (!cityId || !courier) return;
    setLoadingShipping(true);
    try {
      const totalWeight = items.reduce((sum, item) => sum + item.quantity * 500, 0);
      const res = await fetch("/api/shipping/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: cityId,
          weight: totalWeight,
          courier
        })
      });
      const result = await res.json();
      if (result.success && result.data?.costs?.[0]?.cost?.[0]) {
        const costVal = result.data.costs[0].cost[0].value;
        const etdVal = result.data.costs[0].cost[0].etd;
        setShippingCost(costVal);
        setShippingEtd(etdVal);
      } else {
        toast.error("Gagal menghitung ongkos kirim untuk kurir tersebut");
      }
    } catch (err) {
      toast.error("Gagal menghitung ongkos kirim");
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedProvince("");
      setSelectedCity("");
      setCities([]);
      setShippingCost(0);
      setShippingEtd("");
      return;
    }
    const [provId, provName] = val.split("|");
    setSelectedProvince(provName);
    setSelectedCity("");
    setCities([]);
    setShippingCost(0);
    setShippingEtd("");

    try {
      const res = await fetch(`/api/shipping/cities?provinceId=${provId}`);
      const result = await res.json();
      if (result.success) {
        setCities(result.data);
      }
    } catch (err) {
      toast.error("Gagal memuat kota");
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedCity("");
      setShippingCost(0);
      setShippingEtd("");
      return;
    }
    const [cityId, cityName, postalCode] = val.split("|");
    setSelectedCity(cityName);
    setShippingCost(0);
    setShippingEtd("");

    const postalInput = document.getElementById("postal_code") as HTMLInputElement;
    if (postalInput && postalCode) {
      postalInput.value = postalCode;
    }

    if (cityId && selectedCourier) {
      calculateShipping(cityId, selectedCourier);
    }
  };

  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courier = e.target.value;
    setSelectedCourier(courier);
    setShippingCost(0);
    setShippingEtd("");

    const citySelect = document.getElementById("city_select") as HTMLSelectElement;
    if (citySelect && citySelect.value) {
      const cityId = citySelect.value.split("|")[0];
      if (cityId && courier) {
        calculateShipping(cityId, courier);
      }
    }
  };

  // Display-only price calculation (actual total is calculated server-side)
  const getItemDisplayPrice = (item: CartItem) => {
    if (!item.product) return 0;
    const price =
      item.product.discount_percent > 0
        ? item.product.price * (1 - item.product.discount_percent / 100)
        : item.product.price;
    return price * item.quantity;
  };

  const displayTotal = items.reduce(
    (sum, item) => sum + getItemDisplayPrice(item),
    0
  );

  const handleCheckout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedProvince || !selectedCity || !selectedCourier) {
      toast.error("Silakan lengkapi pilihan provinsi, kota, dan kurir");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        shipping_name: formData.get("name") as string,
        shipping_phone: formData.get("phone") as string,
        shipping_address: formData.get("address") as string,
        shipping_city: selectedCity,
        shipping_province: selectedProvince,
        shipping_postal_code: formData.get("postal_code") as string,
        notes: formData.get("notes") as string,
        shipping_cost: shippingCost,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success && result.items && result.shipping) {
        // Send WhatsApp notification with server-verified total
        const waMessage = encodeURIComponent(
          `Pesanan Baru!\n\nNama: ${result.shipping.name}\nTelepon: ${result.shipping.phone}\n\nProduk:\n${result.items.map((i) => `- ${i.name} x${i.quantity}`).join("\n")}\n\nOngkir (${selectedCourier.toUpperCase()}): ${formatPrice(shippingCost)}\nTotal: ${formatPrice(result.total ?? 0)}\nAlamat: ${result.shipping.address}, ${result.shipping.city}`
        );

        toast.success("Pesanan berhasil dibuat!");
        refreshCart();
        window.open(
          `https://wa.me/6281234567890?text=${waMessage}`,
          "_blank"
        );
        router.push("/dashboard/orders");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl">Checkout</h1>

      <form
        onSubmit={handleCheckout}
        className="mt-6 space-y-6"
        key={profile ? "loaded" : "loading"}
      >
        <div className="space-y-4">
          <h2 className="text-sm font-medium">Data Pengiriman</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Penerima</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={profile?.full_name || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                name="phone"
                required
                defaultValue={profile?.phone || ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap</Label>
            <Input
              id="address"
              name="address"
              required
              defaultValue={profile?.address || ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province_select">Provinsi</Label>
              <select
                id="province_select"
                required
                onChange={handleProvinceChange}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map((p) => (
                  <option key={p.province_id} value={`${p.province_id}|${p.province}`}>
                    {p.province}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city_select">Kota</Label>
              <select
                id="city_select"
                required
                onChange={handleCityChange}
                disabled={cities.length === 0}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Pilih Kota</option>
                {cities.map((c) => (
                  <option key={c.city_id} value={`${c.city_id}|${c.city_name}|${c.postal_code}`}>
                    {c.city_name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="courier_select">Kurir Pengiriman</Label>
              <select
                id="courier_select"
                required
                onChange={handleCourierChange}
                disabled={!selectedCity}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">Pilih Kurir</option>
                <option value="jne">JNE (Jalur Nugraha Ekakurir)</option>
                <option value="tiki">TIKI (Titipan Kilat)</option>
                <option value="pos">POS Indonesia</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Kode Pos</Label>
              <Input
                id="postal_code"
                name="postal_code"
                required
                defaultValue={profile?.postal_code || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Catatan untuk penjual"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h2 className="text-sm font-medium">Ringkasan Pesanan</h2>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product?.name} x{item.quantity}
              </span>
              <span>{formatPrice(getItemDisplayPrice(item))}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>
              Ongkos Kirim {selectedCourier && `(${selectedCourier.toUpperCase()})`}
              {shippingEtd && ` - Est: ${shippingEtd}`}
            </span>
            <span>
              {loadingShipping ? (
                <span className="text-muted-foreground animate-pulse">Menghitung...</span>
              ) : shippingCost > 0 ? (
                formatPrice(shippingCost)
              ) : (
                <span className="text-xs text-muted-foreground">Pilih kurir & lokasi</span>
              )}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total Pembayaran</span>
            <span>{formatPrice(displayTotal + shippingCost)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            * Ongkos kirim dihitung otomatis berdasarkan berat parfum dan lokasi tujuan.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={isPending || items.length === 0 || loadingShipping}
        >
          {isPending ? "Memproses..." : "Buat Pesanan & Kirim via WhatsApp"}
        </Button>
      </form>
    </div>
  );
}
