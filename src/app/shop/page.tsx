import { Suspense } from "react";
import Link from "next/link";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { getBrand, getCategory, categories } from "@/lib/data";
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
}

function buildLink(base: ShopSearchParams, overrides: { cursor: string; h: string }) {
  const params = new URLSearchParams();
  if (base.brand) params.set("brand", base.brand);
  if (base.category) params.set("category", base.category);
  if (base.sort) params.set("sort", base.sort);
  if (base.q) params.set("q", base.q);
  if (base.model) params.set("model", base.model);
  if (base.scale) params.set("scale", base.scale);
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
  const isToys = sp.category === "toys";

  // Wizard active only if brand is selected and we are not in Toys category
  const isWizardActive = brand && !isToys;
  const showModelStep = isWizardActive && !sp.model;
  const showCategoryStep = isWizardActive && sp.model && (!sp.category || sp.category === "all");

  // Load models statically from local JSON file
  const models = sp.brand ? ((brandModelsData as Record<string, string[]>)[sp.brand] || []) : [];

  let results: any[] = [];
  let totalCount: number | null = null;
  let isDone = true;
  let continueCursor = "";

  if (!showModelStep && !showCategoryStep) {
    const res = await filterProducts({
      brand: sp.brand,
      category: sp.category,
      sort: sp.sort,
      q: sp.q,
      scale: sp.scale,
      model: sp.model,
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

      {/* Active wizard filters breadcrumbs */}
      {isWizardActive && (sp.model || (sp.category && sp.category !== "all")) && (
        <div className="mb-6 flex flex-wrap gap-2 items-center bg-surface border border-border-c rounded-2xl px-4 py-3 text-xs sm:text-sm">
          <span className="font-semibold text-text-muted">Активни филтри:</span>
          {brand && (
            <Link
              href="/shop"
              className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border-c px-3 py-1 font-semibold text-white hover:border-red-500 hover:text-red-500 transition-colors"
            >
              Марка: {brand.name} <span className="text-[10px] opacity-60">✕</span>
            </Link>
          )}
          {sp.model && (
            <Link
              href={`/shop?brand=${sp.brand}`}
              className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border-c px-3 py-1 font-semibold text-white hover:border-red-500 hover:text-red-500 transition-colors"
            >
              Модел: {sp.model} <span className="text-[10px] opacity-60">✕</span>
            </Link>
          )}
          {category && (
            <Link
              href={`/shop?brand=${sp.brand}&model=${sp.model}`}
              className="flex items-center gap-1.5 rounded-full bg-surface-2 border border-border-c px-3 py-1 font-semibold text-white hover:border-red-500 hover:text-red-500 transition-colors"
            >
              Категория: {category.name} <span className="text-[10px] opacity-60">✕</span>
            </Link>
          )}
        </div>
      )}

      {/* Step 2: Select Model */}
      {showModelStep && (
        <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-10 text-center animate-fade-up">
          <div className="mb-6 flex flex-col items-center justify-center">
            <span className="mb-2 rounded-full bg-accent-lime/10 px-3 py-1 text-xs font-semibold text-accent-lime uppercase tracking-wider">
              Стъпка 2 от 3
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">
              Изберете модел за {brand?.name}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted max-w-md">
              Изберете вашия модел телефон от списъка по-долу, за да покажем съвместимите аксесоари.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
            {models.map((m) => {
              const queryStr = new URLSearchParams();
              if (sp.brand) queryStr.set("brand", sp.brand);
              queryStr.set("model", m);
              if (sp.sort) queryStr.set("sort", sp.sort);
              return (
                <Link
                  key={m}
                  href={`/shop?${queryStr.toString()}`}
                  className="rounded-xl border border-border-c bg-surface-2 p-4 text-sm font-semibold hover:border-accent-lime hover:text-accent-lime transition-all text-center hover:scale-[1.02]"
                >
                  {m}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-border-c/60 pt-6">
            <Link
              href="/shop"
              className="rounded-full border border-border-c px-5 py-2.5 text-xs font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all"
            >
              ← Назад към марките
            </Link>
          </div>
        </div>
      )}

      {/* Step 3: Select Category */}
      {showCategoryStep && (
        <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-10 text-center animate-fade-up">
          <div className="mb-6 flex flex-col items-center justify-center">
            <span className="mb-2 rounded-full bg-accent-lime/10 px-3 py-1 text-xs font-semibold text-accent-lime uppercase tracking-wider">
              Стъпка 3 от 3
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">
              Изберете тип аксесоар за {sp.model}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted max-w-md">
              Последна стъпка: изберете категория аксесоар, за да видите продуктите.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories
              .filter((c) => c.slug !== "toys")
              .map((c) => {
                const queryStr = new URLSearchParams();
                if (sp.brand) queryStr.set("brand", sp.brand);
                if (sp.model) queryStr.set("model", sp.model);
                queryStr.set("category", c.slug);
                if (sp.sort) queryStr.set("sort", sp.sort);
                return (
                  <Link
                    key={c.slug}
                    href={`/shop?${queryStr.toString()}`}
                    className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-c bg-surface-2 p-5 hover:border-accent-lime hover:text-accent-lime transition-all text-center hover:scale-[1.02]"
                  >
                    <span className="text-xs font-bold">{c.name}</span>
                  </Link>
                );
              })}
          </div>

          <div className="mt-8 border-t border-border-c/60 pt-6 flex justify-center gap-4">
            <Link
              href={`/shop?brand=${sp.brand}`}
              className="rounded-full border border-border-c px-5 py-2.5 text-xs font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all"
            >
              ← Назад към моделите
            </Link>
          </div>
        </div>
      )}

      {/* Product list view */}
      {!showModelStep && !showCategoryStep && (
        <>
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
        </>
      )}
    </div>
  );
}
