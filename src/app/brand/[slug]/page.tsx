import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { brands, getBrand, getCategory } from "@/lib/data";
import { filterProducts } from "@/lib/products-server";
import { decodeCursor, decodeHistory, nextLinkParams, prevLinkParams } from "@/lib/pagination";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  return { title: brand ? `${brand.name} аксесоари — Кейсове.нет` : "Кейсове.нет" };
}

interface BrandSearchParams {
  category?: string;
  sort?: string;
  cursor?: string;
  h?: string;
}

function buildLink(slug: string, base: BrandSearchParams, overrides: { cursor: string; h: string }) {
  const params = new URLSearchParams();
  if (base.category) params.set("category", base.category);
  if (base.sort) params.set("sort", base.sort);
  if (overrides.cursor && overrides.cursor !== "start") params.set("cursor", overrides.cursor);
  if (overrides.h) params.set("h", overrides.h);
  const qs = params.toString();
  return `/brand/${slug}${qs ? `?${qs}` : ""}`;
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<BrandSearchParams>;
}) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const history = decodeHistory(sp.h);
  const currentPage = history.length + 1;

  const { products: results, totalCount, isDone, continueCursor } = await filterProducts({
    category: sp.category,
    sort: sp.sort,
    brand: slug,
    cursor: decodeCursor(sp.cursor),
    numItems: 24,
  });
  const category = sp.category ? getCategory(sp.category) : undefined;

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> {brand.name}
      </nav>

      <div className="mb-8 rounded-3xl border border-border-c bg-surface p-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">
          {brand.name} <span className="gradient-text">аксесоари</span>
        </h1>
        <p className="mt-2 text-text-muted">{brand.tagline} — калъфи, протектори и още, подбрани специално за твоя {brand.name} телефон.</p>
      </div>

      <p className="mb-4 text-sm text-text-muted">
        {category ? `${category.name} · ` : ""}
        {totalCount !== null ? `${totalCount} продукта · ` : ""}Страница {currentPage}
      </p>

      <Suspense fallback={null}>
        <ShopFilters basePath={`/brand/${slug}`} showBrands={false} />
      </Suspense>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border-c bg-surface p-12 text-center">
          <p className="text-text-muted">Все още няма продукти в тази категория за {brand.name}.</p>
          <Link href={`/brand/${slug}`} className="mt-4 inline-block rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white">
            Изчисти филтъра
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
                  href={buildLink(slug, sp, prevLinkParams(history))}
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
                  href={buildLink(slug, sp, nextLinkParams(sp.cursor, history, continueCursor))}
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
