"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/lib/supabase/client";

type ChartData = { date: string; revenue: number };

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export function RevenueChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("status", "delivered")
        .order("created_at", { ascending: true });

      if (period !== "all") {
        const days = period === "7d" ? 7 : 30;
        const from = new Date();
        from.setDate(from.getDate() - days);
        query = query.gte("created_at", from.toISOString());
      }

      const { data: orders } = await query;
      if (!orders) { setData([]); setTotal(0); return; }

      // Group by date
      const grouped: Record<string, number> = {};
      let sum = 0;
      orders.forEach((o) => {
        const date = new Date(o.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        grouped[date] = (grouped[date] || 0) + o.total_amount;
        sum += o.total_amount;
      });

      setData(Object.entries(grouped).map(([date, revenue]) => ({ date, revenue })));
      setTotal(sum);
    };
    fetch();
  }, [period]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Pemasukan</h2>
          <p className="text-2xl font-semibold mt-1">{formatPrice(total)}</p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                period === p ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 Hari" : p === "30d" ? "30 Hari" : "Semua"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-52 sm:h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(value: any) => formatPrice(Number(value))} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#8A9A86" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Belum ada data pemasukan
          </div>
        )}
      </div>
    </div>
  );
}
