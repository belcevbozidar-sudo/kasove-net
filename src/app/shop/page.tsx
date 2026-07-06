import { Suspense } from "react";
import Link from "next/link";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { getBrand, getCategory } from "@/lib/data";
import { filterProducts } from "@/lib/products-server";
import { decodeCursor, decodeHistory, nextLinkParams, prevLinkParams } from "@/lib/pagination";

export const metadata = {
  title: "Магазин — Кейсове.нет",
};

interface ShopSearchParams {
  brand?: string;
  category?: string;
  sort?: string;
  q?: string;
  cursor?: string;
  h?: string;
}

function buildLink(base: ShopSearchParams, overrides: { cursor: string; h: string }) {
  const params = new URLSearchParams();
  if (base.brand) params.set("brand", base.brand);
  if (base.category) params.set("category", base.category);
  if (base.sort) params.set("sort", base.sort);
  if (base.q) params.set("q", base.q);
  if (overrides.cursor && overrides.cursor !== "start") params.set("cursor", overrides.cursor);
  if (overrides.h) params.set("h", overrides.h);
  const qs = params.toString();
  return `/shop${qs ? `?${qs}` : ""}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const sp = await searchParams;
  const history = decodeHistory(sp.h);
  const currentPage = history.length + 1;

  const { products: results, totalCount, isDone, continueCursor } = await filterProducts({
    brand: sp.brand,
    category: sp.category,
    sort: sp.sort,
    q: sp.q,
    cursor: decodeCursor(sp.cursor),
    numItems: 24,
  });

  const brand = sp.brand ? getBrand(sp.brand) : undefined;
  const category = sp.category ? getCategory(sp.category) : undefined;

  const title = [brand?.name, category?.name].filter(Boolean).join(" · ") || "Всички продукти";

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> Магазин
      </nav>
      <h1 className="mb-1 font-heading text-3xl font-extrabold">{title}</h1>
      <p className="mb-6 text-sm text-text-muted">
        {totalCount !== null ? `${totalCount} продукта · ` : ""}Страница {currentPage}
      </p>

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
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {(currentPage > 1 || !isDone) && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildLink(sp, prevLinkParams(history))}
                  className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  ← Предишна
                </Link>
              ) : (
                <span className="rounded-xl border border-border-c bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted cursor-not-allowed">
                  ← Предишна
                </span>
              )}

              <span className="text-sm text-text-muted font-semibold px-2">
                Страница {currentPage}
              </span>

              {!isDone ? (
                <Link
                  href={buildLink(sp, nextLinkParams(sp.cursor, history, continueCursor))}
                  className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  Следваща →
                </Link>
              ) : (
                <span className="rounded-xl border border-border-c bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted cursor-not-allowed">
                  Следваща →
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
