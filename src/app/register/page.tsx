"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrasi berhasil! Cek email untuk verifikasi.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12" suppressHydrationWarning>
      <div className="w-full max-w-sm space-y-6" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <h1 className="font-serif text-2xl">Daftar</h1>
          <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
            Buat akun baru untuk mulai berbelanja
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input id="full_name" name="full_name" required placeholder="Nama Anda" />
          </div>
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nama@email.com" />
          </div>
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>

        <div className="relative" suppressHydrationWarning>
          <div className="absolute inset-0 flex items-center" suppressHydrationWarning>
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase" suppressHydrationWarning>
            <span className="bg-background px-2 text-muted-foreground">atau</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
          Daftar dengan Google
        </Button>

        <p className="text-center text-sm text-muted-foreground" suppressHydrationWarning>
          Sudah punya akun?{" "}
          <Link href="/login" className="text-foreground underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
