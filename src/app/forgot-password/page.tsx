"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link reset password telah dikirim ke email Anda.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12" suppressHydrationWarning>
      <div className="w-full max-w-sm space-y-6" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <h1 className="font-serif text-2xl">Lupa Password</h1>
          <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
            Masukkan email Anda untuk menerima link reset password
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2" suppressHydrationWarning>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nama@email.com" />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground" suppressHydrationWarning>
          <Link href="/login" className="text-foreground underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
