"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { brands, categories } from "@/lib/data";

export default function ShopFilters({
  basePath = "/shop",
  showBrands = true,
}: {
  basePath?: string;
  showBrands?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeBrand = searchParams.get("brand") ?? "all";
  const activeCategory = searchParams.get("category") ?? "all";
  const activeSort = searchParams.get("sort") ?? "featured";
  const activeScale = searchParams.get("scale") ?? "all";
  const q = searchParams.get("q");

  const isToys = activeCategory === "toys";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "featured") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page cursor when filter changes
    params.delete("cursor");
    params.delete("h");
    router.push(`${basePath}?${params.toString()}`);
  }

  const scales = [
    { label: "Всички мащаби", value: "all" },
    { label: "Мащаб 1:18", value: "1:18" },
    { label: "Мащаб 1:24", value: "1:24" },
    { label: "Мащаб 1:32", value: "1:32" },
  ];

  return (
    <div className="mb-8 space-y-5">
      {q && (
        <p className="text-sm text-text-muted">
          Резултати за <span className="font-semibold text-text">&ldquo;{q}&rdquo;</span>
        </p>
      )}

      {isToys ? (
        // Toys layout: Scale filters only, plus a button to return to all categories
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateParam("category", "all")}
              className="rounded-full border border-border-c bg-surface px-4 py-2 text-xs font-semibold text-text-muted hover:text-text transition-colors flex items-center gap-1.5"
            >
              ← Към аксесоарите
            </button>
            <div className="h-4 w-px bg-border-c" />
            <span className="text-sm font-semibold text-accent-lime uppercase tracking-wider">Мащаб:</span>
          </div>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
            {scales.map((s) => (
              <button
                key={s.value}
                onClick={() => updateParam("scale", s.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeScale === s.value ? "gradient-brand text-white" : "border border-border-c text-text-muted hover:text-text"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Accessories layout
        <>
          {showBrands && (
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => updateParam("brand", "all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeBrand === "all" ? "gradient-brand text-white" : "border border-border-c text-text-muted hover:text-text"
                }`}
              >
                Всички марки
              </button>
              {brands.map((b) => (
                <button
                  key={b.slug}
                  onClick={() => updateParam("brand", b.slug)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeBrand === b.slug ? "gradient-brand text-white" : "border border-border-c text-text-muted hover:text-text"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => updateParam("category", "all")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === "all" ? "bg-accent-lime text-bg" : "bg-surface-2 text-text-muted hover:text-text"
                }`}
              >
                Всички категории
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => updateParam("category", c.slug)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeCategory === c.slug ? "bg-accent-lime text-bg" : "bg-surface-2 text-text-muted hover:text-text"
                  }`}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Sorting remains available for both layouts */}
      <div className="flex justify-end border-t border-border-c/40 pt-3">
        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-full border border-border-c bg-surface px-3.5 py-2 text-xs font-medium outline-none"
        >
          <option value="featured">Препоръчани</option>
          <option value="price-asc">Цена: ниска към висока</option>
          <option value="price-desc">Цена: висока към ниска</option>
          <option value="rating">Най-високо оценени</option>
        </select>
      </div>
    </div>
  );
}
