import { Suspense } from "react";
import Link from "next/link";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { filterProducts, getBrand, getCategory } from "@/lib/data";

export const metadata = {
  title: "Магазин — Кейсове.нет",
};

interface ShopSearchParams {
  brand?: string;
  category?: string;
  sort?: string;
  q?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const sp = await searchParams;
  const results = filterProducts(sp);
  const brand = sp.brand ? getBrand(sp.brand) : undefined;
  const category = sp.category ? getCategory(sp.category) : undefined;

  const title = [brand?.name, category?.name].filter(Boolean).join(" · ") || "Всички продукти";

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> Магазин
      </nav>
      <h1 className="mb-1 font-heading text-3xl font-extrabold">{title}</h1>
      <p className="mb-6 text-sm text-text-muted">{results.length} продукта</p>

      <Suspense fallback={null}>
        <ShopFilters />
      </Suspense>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border-c bg-surface p-12 text-center">
          <p className="text-text-muted">Няма намерени продукти по зададените филтри.</p>
          <Link href="/shop" className="mt-4 inline-block rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white">
            Изчисти филтрите
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
