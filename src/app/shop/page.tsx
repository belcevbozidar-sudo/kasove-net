import { Suspense } from "react";
import Link from "next/link";
import SidebarFilters from "@/components/SidebarFilters";
import ProductCard from "@/components/ProductCard";
import BrandModelSelector from "@/components/BrandModelSelector";
import { getBrand, getCategory, categories, brands } from "@/lib/data";
import { filterProducts } from "@/lib/products-server";
import { decodeCursor, decodeHistory, nextLinkParams, prevLinkParams } from "@/lib/pagination";
import brandModelsData from "@/lib/models.json";

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
  model?: string;
  scale?: string;
  maxPrice?: string;
}

function buildLink(base: ShopSearchParams, overrides: { cursor: string; h: string }) {
  const params = new URLSearchParams();
  if (base.brand) params.set("brand", base.brand);
  if (base.category) params.set("category", base.category);
  if (base.sort) params.set("sort", base.sort);
  if (base.q) params.set("q", base.q);
  if (base.model) params.set("model", base.model);
  if (base.scale) params.set("scale", base.scale);
  if (base.maxPrice) params.set("maxPrice", base.maxPrice);
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

  const brand = sp.brand ? getBrand(sp.brand) : undefined;
  const category = sp.category ? getCategory(sp.category) : undefined;

  // Wizard logic:
  // Step 1: If category selected, but brand is missing
  const showBrandSelectionStep = sp.category && !sp.brand;

  // Step 2: If brand is selected, but model is missing (excluding non-phone collections)
  const showModelSelectionStep = sp.brand && !sp.model && sp.brand !== "other" && sp.brand !== "diecast-cars";

  const showWizard = showBrandSelectionStep || showModelSelectionStep;

  // Load models statically from local JSON file
  const models = sp.brand ? ((brandModelsData as Record<string, string[]>)[sp.brand] || []) : [];
  const maxPriceNum = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;

  let results: any[] = [];
  let totalCount: number | null = null;
  let isDone = true;
  let continueCursor = "";

  if (!showWizard) {
    const res = await filterProducts({
      brand: sp.brand,
      category: sp.category,
      sort: sp.sort,
      q: sp.q,
      scale: sp.scale,
      model: sp.model,
      maxPrice: maxPriceNum,
      cursor: decodeCursor(sp.cursor),
      numItems: 24,
    });
    results = res.products;
    totalCount = res.totalCount;
    isDone = res.isDone;
    continueCursor = res.continueCursor;
  }

  const title = [brand?.name, sp.model, category?.name].filter(Boolean).join(" · ") || "Всички продукти";

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> Магазин
      </nav>
      
      <h1 className="mb-1 font-heading text-3xl font-extrabold">{title}</h1>
      <p className="mb-6 text-sm text-text-muted">
        {totalCount !== null ? `${totalCount} продукта · ` : ""}Страница {currentPage}
      </p>

      {/* Brand Selection Step (Category-first flow Step 1) */}
      {showBrandSelectionStep && (
        <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-10 text-center animate-fade-up">
          <div className="mb-6 flex flex-col items-center justify-center">
            <span className="mb-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
              Стъпка 1 от 2
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">
              Изберете марка за {category?.name}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted max-w-md">
              Изберете марката на вашия телефон, за да видите наличните съвместими продукти.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {brands
              .filter(b => b.slug !== "universal" && b.slug !== "other" && b.slug !== "diecast-cars")
              .map((b) => {
                const queryStr = new URLSearchParams();
                if (sp.category) queryStr.set("category", sp.category);
                queryStr.set("brand", b.slug);
                return (
                  <Link
                    key={b.slug}
                    href={`/shop?${queryStr.toString()}`}
                    className="rounded-xl border border-border-c bg-surface-2 p-4 text-sm font-semibold hover:border-accent hover:text-accent transition-all text-center hover:scale-[1.02]"
                  >
                    {b.name}
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Model Selection Step (Both Category-first Step 2 and Brand-first click) */}
      {showModelSelectionStep && (
        <BrandModelSelector
          brandSlug={sp.brand!}
          brandName={brand?.name || ""}
          models={models}
          categorySlug={sp.category}
        />
      )}

      {/* Main Product list view with Sidebar Layout */}
      {!showWizard && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Left Column */}
          <Suspense fallback={<div className="w-full lg:w-64 h-96 bg-surface animate-pulse rounded-3xl" />}>
            <SidebarFilters availableModels={models} />
          </Suspense>

          {/* Right Column: Grid and Pagination */}
          <div className="flex-1 w-full">
            {results.length === 0 ? (
              <div className="rounded-3xl border border-border-c bg-surface p-16 text-center">
                <p className="text-text-muted font-medium text-lg">Няма намерени продукти по зададените филтри.</p>
                <Link href="/shop" className="mt-5 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                  Изчисти филтрите
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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

                    <span className="text-sm font-bold text-text px-4">
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
        </div>
      )}
    </div>
  );
}

