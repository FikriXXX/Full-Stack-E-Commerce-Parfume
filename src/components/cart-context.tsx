"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCartCount = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCartCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("carts")
        .select("quantity")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching cart count:", error);
        return;
      }

      const count = data ? data.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      setCartCount(count);
    } catch (err) {
      console.error("Cart count error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCartCount();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart: fetchCartCount, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
