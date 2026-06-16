"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil masuk");
      router.push("/");
      router.refresh();
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
          <h1 className="font-serif text-2xl">Masuk</h1>
          <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nama@email.com" />
          </div>
          <div className="space-y-2" suppressHydrationWarning>
            <div className="flex items-center justify-between" suppressHydrationWarning>
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                Lupa password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
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
          Masuk dengan Google
        </Button>

        <p className="text-center text-sm text-muted-foreground" suppressHydrationWarning>
          Belum punya akun?{" "}
          <Link href="/register" className="text-foreground underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
