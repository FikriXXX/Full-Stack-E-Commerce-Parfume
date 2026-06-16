import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Package, ShieldAlert } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    isAdmin = data?.role === "admin";
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-48">
          <nav className="flex gap-2 md:flex-col">
            <Button variant="ghost" className="justify-start" render={<Link href="/dashboard" />}>
              <User className="mr-2 h-4 w-4" />Profil
            </Button>
            <Button variant="ghost" className="justify-start" render={<Link href="/dashboard/orders" />}>
              <Package className="mr-2 h-4 w-4" />Pesanan
            </Button>
            {isAdmin && (
              <Button variant="ghost" className="justify-start text-accent hover:text-accent/80 hover:bg-accent/10" render={<Link href="/admin" />}>
                <ShieldAlert className="mr-2 h-4 w-4" />Super Admin
              </Button>
            )}
            <LogoutButton />
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
