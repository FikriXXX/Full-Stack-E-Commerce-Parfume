import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "./filters";
import type { Product, Category } from "@/lib/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";

  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const supabase = await createClient();

    let query = supabase.from("products").select("*, category:categories(*), reviews(rating)");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      if (cat) {
        query = query.eq("category_id", cat.id);
      }
    }

    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: prods } = await query;
    const { data: cats } = await supabase.from("categories").select("*");
    products = (prods as Product[]) || [];
    categories = (cats as Category[]) || [];
  } catch {
    // Supabase not configured yet
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl">Katalog Parfum</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Temukan parfum yang sesuai dengan kepribadian Anda
        </p>
      </div>

      <ProductFilters
        categories={categories}
        currentCategory={category}
        currentSearch={search}
        currentSort={sort}
      />

      {products.length > 0 ? (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">Tidak ada produk ditemukan.</p>
        </div>
      )}
    </div>
  );
}
