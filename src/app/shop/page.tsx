import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import SidebarFilters from "@/components/SidebarFilters";
import ProductCard from "@/components/ProductCard";
import BrandModelSelector from "@/components/BrandModelSelector";
import { getBrand, getCategory, categories, brands, NON_PHONE_CATEGORIES } from "@/lib/data";
import { formatModelDisplay } from "@/lib/format-model";
import { filterProducts } from "@/lib/products-server";
import { decodeCursor, decodeHistory, nextLinkParams, prevLinkParams, backNPagesParams, START_CURSOR } from "@/lib/pagination";
import brandModelsData from "@/lib/models.json";

const PAGE_SIZE = 24;
const SKIP_HOP = 5;

export const metadata = {
  title: "Магазин — Кейсове.нет",
};

// Brands with a generated background photo at /images/brands/<slug>.jpg —
// any brand not in this set falls back to a themed gradient below.
const BRAND_PHOTO_SLUGS = new Set(["apple", "samsung", "xiaomi", "honor", "motorola", "huawei", "nokia", "realme"]);
const BRAND_GRADIENTS: Record<string, string> = {
  nokia: "from-cyan-500/70 via-sky-900 to-zinc-950",
  realme: "from-amber-400/70 via-amber-900 to-zinc-950",
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
  jump?: string;
  skip?: string;
}

// If a free-text search (?q=) exactly names a known model — "S24 Ultra",
// "Samsung S24 Ultra", "iPhone 17 Pro Max" — treat it as if that model had
// been picked from the wizard instead of running a fuzzy name search: exact
// results from the model index, and the page (title, sidebar, wizard-skip)
// behaves exactly like the real model-filtered view.
function detectModelFromQuery(q: string): { brand: string; model: string } | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const modelsData = brandModelsData as Record<string, string[]>;

  for (const brand of Object.keys(modelsData)) {
    if (!lower.startsWith(brand.toLowerCase() + " ")) continue;
    const rest = trimmed.slice(brand.length).trim();
    const match = modelsData[brand].find((m) => m.toLowerCase() === rest.toLowerCase());
    if (match) return { brand, model: match };
  }
  for (const brand of Object.keys(modelsData)) {
    const match = modelsData[brand].find((m) => m.toLowerCase() === lower);
    if (match) return { brand, model: match };
  }
  return null;
}

function buildLink(base: ShopSearchParams, overrides: { cursor: string; h: string }, extra?: Record<string, string>) {
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
  if (extra) {
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
  }
  const qs = params.toString();
  return `/shop${qs ? `?${qs}` : ""}`;
}

// Direct link to the true last page — cheap on the backend (flips the sort
// order and takes+reverses, O(page-size) regardless of catalog size), but it
// lands with no forward-history stack, so "Previous" from there falls back to
// page 1 rather than stepping back precisely. Accepted trade-off: reaching
// the last page any other way would require walking every page in between.
function buildLastPageLink(base: ShopSearchParams) {
  const params = new URLSearchParams();
  if (base.brand) params.set("brand", base.brand);
  if (base.category) params.set("category", base.category);
  if (base.sort) params.set("sort", base.sort);
  if (base.q) params.set("q", base.q);
  if (base.model) params.set("model", base.model);
  if (base.scale) params.set("scale", base.scale);
  if (base.maxPrice) params.set("maxPrice", base.maxPrice);
  params.set("jump", "last");
  return `/shop?${params.toString()}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const sp = await searchParams;

  if (sp.q && !sp.model) {
    const detected = detectModelFromQuery(sp.q);
    if (detected) {
      const params = new URLSearchParams();
      params.set("brand", detected.brand);
      params.set("model", detected.model);
      if (sp.category) params.set("category", sp.category);
      redirect(`/shop?${params.toString()}`);
    }
  }

  const history = decodeHistory(sp.h);
  const maxPriceNum = sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined;

  // Skip-several-forward (»): Convex cursors are opaque, so reaching a page
  // several hops ahead means walking there hop-by-hop server-side first, then
  // redirecting to the canonical cursor/history URL so the address bar, the
  // browser back button, and refresh all keep working normally afterward.
  // Bounded to SKIP_HOP (5) pages per click, so the extra fetches are cheap.
  if (sp.skip) {
    const skipN = Math.min(SKIP_HOP, Math.max(0, parseInt(sp.skip, 10) || 0));
    let hist = [...history];
    let token = sp.cursor;
    for (let i = 0; i < skipN; i++) {
      const res = await filterProducts({
        brand: sp.brand,
        category: sp.category,
        sort: sp.sort,
        q: sp.q,
        scale: sp.scale,
        model: sp.model,
        maxPrice: maxPriceNum,
        cursor: decodeCursor(token),
        numItems: PAGE_SIZE,
      });
      if (res.isDone) break;
      hist = [...hist, token ?? START_CURSOR];
      token = res.continueCursor;
    }
    redirect(buildLink(sp, { cursor: token ?? START_CURSOR, h: hist.join(",") }));
  }

  const jumpToLast = sp.jump === "last";
  const currentPage = history.length + 1;

  const brand = sp.brand ? getBrand(sp.brand) : undefined;
  const category = sp.category ? getCategory(sp.category) : undefined;

  // Wizard logic:
  // Step 1: If category selected, but brand is missing. Skipped for categories
  // that aren't phone accessories (toys/diecast) — those have no brand to pick.
  const showBrandSelectionStep = sp.category && !sp.brand && !NON_PHONE_CATEGORIES.has(sp.category);

  // Step 2: If brand is selected, but model is missing (excluding non-phone collections)
  const showModelSelectionStep = sp.brand && !sp.model && sp.brand !== "other" && sp.brand !== "diecast-cars" && sp.brand !== "universal";

  const showWizard = showBrandSelectionStep || showModelSelectionStep;

  // Load models statically from local JSON file
  const models = sp.brand ? ((brandModelsData as Record<string, string[]>)[sp.brand] || []) : [];

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
      numItems: PAGE_SIZE,
      jumpToLastPage: jumpToLast || undefined,
    });
    results = res.products;
    totalCount = res.totalCount;
    isDone = res.isDone;
    continueCursor = res.continueCursor;
  }

  // Only meaningful when the backend knows the true row count (every filter
  // combo except free-text keyword search, which Convex can't count cheaply).
  const lastPage = totalCount !== null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;
  // A jumpToLastPage fetch intentionally resets history (see buildLastPageLink),
  // so the page number to display has to come from the count, not from `history`.
  const displayPage = jumpToLast && lastPage !== null ? lastPage : currentPage;

  function pageLinkParams(targetPage: number) {
    if (targetPage === displayPage) return { cursor: sp.cursor ?? START_CURSOR, h: sp.h ?? "" };
    if (targetPage < displayPage) return backNPagesParams(history, displayPage, displayPage - targetPage);
    return nextLinkParams(sp.cursor, history, continueCursor);
  }

  // formatModelDisplay already prefixes the brand name onto the model (e.g.
  // "Samsung S24 Ultra"), so when both are present, drop the separate brand
  // segment below to avoid showing the brand name twice.
  const modelTitlePart = sp.model && sp.brand ? formatModelDisplay(sp.brand, sp.model) : sp.model;
  const titleParts = sp.model && sp.brand ? [modelTitlePart, category?.name] : [brand?.name, modelTitlePart, category?.name];
  const title = titleParts.filter(Boolean).join(" · ") || "Всички продукти";

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> Магазин
      </nav>
      
      <h1 className="mb-1 font-heading text-3xl font-extrabold">{title}</h1>
      <p className="mb-6 text-sm text-text-muted">
        {totalCount !== null ? `${totalCount} продукта · ` : ""}Страница {displayPage}{lastPage !== null ? ` от ${lastPage}` : ""}
      </p>

      {/* Brand Selection Step (Category-first flow Step 1) */}
      {showBrandSelectionStep && (
        <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-10 text-center animate-fade-up">
          <div className="mb-8 flex flex-col items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">
              Изберете марка{category?.name ? ` за ${category.name}` : ""}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted max-w-md">
              Изберете марката на вашия телефон, за да видите наличните съвместими продукти.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-4 w-full">
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
                    className="group relative flex aspect-[1.45/1] flex-col items-center justify-between rounded-[2rem] border border-border-c bg-zinc-950 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] overflow-hidden"
                  >
                    {/* Generated Brand Image Background, or a themed gradient for brands without one yet */}
                    {BRAND_PHOTO_SLUGS.has(b.slug) ? (
                      <img
                        src={`/images/brands/${b.slug}.jpg`}
                        alt={`${b.name} background`}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${BRAND_GRADIENTS[b.slug] ?? "from-zinc-700 to-zinc-950"} opacity-70 group-hover:opacity-85 transition-all duration-500`}
                      />
                    )}

                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                    <div className="relative z-10 flex-1 flex items-center justify-center w-full" />

                    {/* Text label underneath */}
                    <span className="relative z-10 text-sm font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-auto group-hover:text-accent transition-colors duration-300">
                      {b.name}
                    </span>
                  </Link>
                );
              })}

            {/* Универсални — many products (screen protectors, chargers,
                cases, power banks, ...) aren't tied to any single phone
                brand at all; without this tile they were unreachable from
                the wizard no matter which real brand a visitor picked. */}
            <Link
              href={`/shop?${new URLSearchParams({ ...(sp.category ? { category: sp.category } : {}), brand: "universal" }).toString()}`}
              className="group relative flex aspect-[1.45/1] flex-col items-center justify-between rounded-[2rem] border border-border-c bg-zinc-950 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-zinc-950 opacity-70 group-hover:opacity-85 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="relative z-10 flex-1 flex items-center justify-center w-full" />
              <span className="relative z-10 text-sm font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-auto group-hover:text-accent transition-colors duration-300">
                Универсални
              </span>
            </Link>
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

                {(displayPage > 1 || !isDone) && (
                  <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
                    {displayPage > SKIP_HOP && (
                      <Link
                        href={buildLink(sp, backNPagesParams(history, displayPage, SKIP_HOP))}
                        title={`${SKIP_HOP} страници назад`}
                        className="rounded-xl border border-border-c bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                      >
                        «
                      </Link>
                    )}

                    {displayPage > 1 ? (
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

                    {lastPage !== null ? (
                      <div className="flex items-center gap-2">
                        {[1, ...(lastPage >= 2 ? [2] : [])].map((p) =>
                          p === displayPage ? (
                            <span key={p} className="rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-white">
                              {p}
                            </span>
                          ) : (
                            <Link
                              key={p}
                              // Landing on the last page via jumpToLast wipes `history` (see
                              // buildLastPageLink), so page 2 has no known cursor to jump back
                              // to from there — walk forward one hop from page 1 instead.
                              href={
                                p === 2 && history.length === 0 && displayPage !== 1
                                  ? buildLink(sp, { cursor: START_CURSOR, h: "" }, { skip: "1" })
                                  : buildLink(sp, pageLinkParams(p))
                              }
                              className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                            >
                              {p}
                            </Link>
                          )
                        )}

                        {lastPage > 3 && <span className="px-1 text-sm text-text-muted">…</span>}

                        {lastPage > 2 &&
                          (lastPage === displayPage ? (
                            <span className="rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-white">
                              {lastPage}
                            </span>
                          ) : lastPage <= displayPage + 1 ? (
                            <Link
                              href={buildLink(sp, pageLinkParams(lastPage))}
                              className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                            >
                              {lastPage}
                            </Link>
                          ) : (
                            <Link
                              href={buildLastPageLink(sp)}
                              className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                            >
                              {lastPage}
                            </Link>
                          ))}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-text px-4">Страница {displayPage}</span>
                    )}

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

                    {!isDone && lastPage !== null && displayPage + SKIP_HOP < lastPage && (
                      <Link
                        href={buildLink(sp, { cursor: sp.cursor ?? START_CURSOR, h: sp.h ?? "" }, { skip: String(SKIP_HOP) })}
                        title={`${SKIP_HOP} страници напред`}
                        className="rounded-xl border border-border-c bg-surface px-3 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                      >
                        »
                      </Link>
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

