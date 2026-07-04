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
  const q = searchParams.get("q");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "featured") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="mb-8 space-y-5">
      {q && (
        <p className="text-sm text-text-muted">
          Резултати за <span className="font-semibold text-text">&ldquo;{q}&rdquo;</span>
        </p>
      )}

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
