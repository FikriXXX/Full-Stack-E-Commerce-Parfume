"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Search,
  ShoppingBag,
  Heart,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Katalog" },
  { href: "/products?category=exclusive", label: "Exclusive" },
];

export function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setLoggedIn(!!session);
        if (session?.user) {
          supabase.from("profiles").select("role").eq("id", session.user.id).single().then(({ data }) => {
            setIsAdmin(data?.role === "admin");
          });
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setLoggedIn(!!session);
        if (!session) setIsAdmin(false);
      });
      return () => subscription.unsubscribe();
    } catch {
      // Supabase not configured
    }
  }, []);

  const accountHref = loggedIn ? "/dashboard" : "/login";

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setLoggedIn(false);
      router.push("/");
      router.refresh();
    } catch {}
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-serif text-lg sm:text-xl tracking-wide">
          Maison Parfum
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="text-sm tracking-wide text-accent transition-colors hover:text-accent/80">
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Search - hidden on small mobile */}
          <Link href="/products" className="hidden sm:inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors">
            <Search className="h-4 w-4" />
          </Link>
          {/* Cart - always visible */}
          <Link href="/cart" className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors">
            <ShoppingBag className="h-4 w-4" />
          </Link>
          {/* User - always visible */}
          <Link href={accountHref} className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors">
            <User className="h-4 w-4" />
          </Link>
          {/* Theme - hidden on small mobile */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Hamburger - mobile & tablet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors md:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="border-b border-border px-6 py-5">
                  <p className="font-serif text-lg">Maison Parfum</p>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="my-4 border-t border-border" />

                  <div className="space-y-1">
                    <Link href="/products" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <Search className="h-4 w-4" />Cari Produk
                    </Link>
                    <Link href="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <Heart className="h-4 w-4" />Wishlist
                    </Link>
                    <Link href="/cart" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <ShoppingBag className="h-4 w-4" />Keranjang
                    </Link>
                    <Link href={accountHref} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <User className="h-4 w-4" />{loggedIn ? "Akun Saya" : "Masuk / Daftar"}
                    </Link>
                    {loggedIn && (
                      <button
                        onClick={() => { handleLogout(); setOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-secondary"
                      >
                        <LogOut className="h-4 w-4" />Keluar
                      </button>
                    )}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-secondary">
                        <Settings className="h-4 w-4" />Admin Panel
                      </Link>
                    )}
                  </div>
                </nav>

                {/* Footer */}
                <div className="border-t border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mode Gelap</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
