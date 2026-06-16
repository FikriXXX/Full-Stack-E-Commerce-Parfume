import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

async function getSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("store_settings").select("*");
    const map: Record<string, string> = {};
    data?.forEach((row: { key: string; value: string }) => { map[row.key] = row.value; });
    return map;
  } catch {
    return {};
  }
}

export async function Footer() {
  const s = await getSettings();

  const socials = [
    { label: "Instagram", url: s.instagram },
    { label: "TikTok", url: s.tiktok },
    { label: "Facebook", url: s.facebook },
    { label: "Twitter / X", url: s.twitter },
  ].filter((x) => x.url);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="font-serif text-lg">{s.store_name || "Maison Parfum"}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {s.store_description || "Koleksi parfum premium pilihan terbaik. Temukan aroma signature Anda dari berbagai brand ternama."}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-medium">Navigasi</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">Katalog</Link></li>
              <li><Link href="/products?category=exclusive" className="hover:text-foreground">Exclusive</Link></li>
              <li><Link href="/products?category=unisex" className="hover:text-foreground">Unisex</Link></li>
            </ul>
          </div>

          {/* Pelanggan */}
          <div>
            <h4 className="text-sm font-medium">Pelanggan</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground">Akun Saya</Link></li>
              <li><Link href="/dashboard/orders" className="hover:text-foreground">Pesanan</Link></li>
              <li><Link href="/wishlist" className="hover:text-foreground">Wishlist</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-sm font-medium">Hubungi Kami</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {s.whatsapp && <li>WhatsApp: {s.whatsapp}</li>}
              {s.email && <li>Email: {s.email}</li>}
              {s.open_hours && <li>{s.open_hours}</li>}
              {s.address && <li>{s.address}</li>}
            </ul>
            {socials.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium">Sosial Media</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {socials.map((social) => (
                    <li key={social.label}>
                      <a href={social.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6 sm:my-8" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {s.store_name || "Maison Parfum"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
