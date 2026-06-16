import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
import { RevenueChart } from "@/components/revenue-chart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default async function AdminDashboardPage() {
  let totalProducts = 0;
  let totalOrders = 0;
  let totalUsers = 0;
  let totalRevenue = 0;
  let pendingOrders = 0;
  let recentOrders: { id: string; total_amount: number; status: string; created_at: string; profiles: { full_name: string | null } | null }[] = [];

  try {
    const supabase = await createClient();
    const [prodRes, orderRes, userRes, ordersData, recent] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount, status").eq("status", "delivered"),
      supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    ]);
    totalProducts = prodRes.count || 0;
    totalOrders = orderRes.count || 0;
    totalUsers = userRes.count || 0;
    totalRevenue = ordersData.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    pendingOrders = ordersData.data?.filter((o) => o.status === "pending").length || 0;
    recentOrders = (recent.data as typeof recentOrders) || [];
  } catch {
    // Supabase not configured
  }

  const stats = [
    { label: "Total Produk", value: totalProducts, icon: Package },
    { label: "Total Pesanan", value: totalOrders, icon: ShoppingCart },
    { label: "Total User", value: totalUsers, icon: Users },
    { label: "Total Pendapatan", value: formatPrice(totalRevenue), icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pendingOrders} Pesanan menunggu diproses
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-secondary p-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-medium">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-sm font-medium">Pesanan Terbaru</h2>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Belum ada pesanan.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-2 pr-4 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                    <td className="py-2 pr-4">{order.profiles?.full_name || "-"}</td>
                    <td className="py-2 pr-4">{formatPrice(order.total_amount)}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{order.status}</span>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
