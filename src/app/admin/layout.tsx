import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Tag, ShoppingCart, Users, Image, Settings, Star } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-52">
          <h2 className="font-serif text-lg">Admin</h2>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col">
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin" />}>
              <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/products" />}>
              <Package className="mr-2 h-4 w-4" />Produk
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/categories" />}>
              <Tag className="mr-2 h-4 w-4" />Kategori
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/orders" />}>
              <ShoppingCart className="mr-2 h-4 w-4" />Pesanan
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/users" />}>
              <Users className="mr-2 h-4 w-4" />Users
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/reviews" />}>
              <Star className="mr-2 h-4 w-4" />Ulasan
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/banners" />}>
              <Image className="mr-2 h-4 w-4" />Banner
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" render={<Link href="/admin/settings" />}>
              <Settings className="mr-2 h-4 w-4" />Pengaturan
            </Button>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
