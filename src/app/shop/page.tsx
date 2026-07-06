import { Suspense } from "react";
import Link from "next/link";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { getBrand, getCategory } from "@/lib/data";
import { filterProducts } from "@/lib/products-server";

export const metadata = {
  title: "Магазин — Кейсове.нет",
};

interface ShopSearchParams {
  brand?: string;
  category?: string;
  sort?: string;
  q?: string;
  page?: string;
}

function getPageLink(pageNum: number, searchParams: ShopSearchParams) {
  const params = new URLSearchParams();
  if (searchParams.brand) params.set("brand", searchParams.brand);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.q) params.set("q", searchParams.q);
  params.set("page", String(pageNum));
  return `/shop?${params.toString()}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const limit = 24;
  
  const { products: results, totalCount, totalPages, currentPage } = filterProducts({
    brand: sp.brand,
    category: sp.category,
    sort: sp.sort,
    q: sp.q,
    page,
    limit,
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
      <p className="mb-6 text-sm text-text-muted">{totalCount} продукта (Страница {currentPage} от {totalPages || 1})</p>

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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={getPageLink(currentPage - 1, sp)}
                  className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  ← Предишна
                </Link>
              ) : (
                <span className="rounded-xl border border-border-c bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted cursor-not-allowed">
                  ← Предишна
                </span>
              )}
              
              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = currentPage - 2 + i;
                  if (currentPage <= 2) pageNum = i + 1;
                  if (currentPage >= totalPages - 1) pageNum = totalPages - 4 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  const isCurrent = pageNum === currentPage;
                  return (
                    <Link
                      key={pageNum}
                      href={getPageLink(pageNum, sp)}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                        isCurrent
                          ? "gradient-brand text-white"
                          : "border border-border-c bg-surface text-text hover:bg-surface-2"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              
              <span className="sm:hidden text-sm text-text-muted font-semibold px-2">
                {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={getPageLink(currentPage + 1, sp)}
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
