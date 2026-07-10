"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { categories, brands, formatPrice } from "@/lib/data";

interface SidebarFiltersProps {
  availableModels: string[];
}

export default function SidebarFilters({ availableModels }: SidebarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "all";
  const activeBrand = searchParams.get("brand") ?? "all";
  const activeModel = searchParams.get("model") ?? "";
  const activeSort = searchParams.get("sort") ?? "featured";
  
  // Internal price is in BGN (0 to 100 BGN corresponds to 0 to ~51 EUR)
  const initialMaxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!, 10) : 100;
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

  // Sync state with URL parameter if it changes externally
  useEffect(() => {
    const urlPrice = searchParams.get("maxPrice");
    if (urlPrice) {
      setMaxPrice(parseInt(urlPrice, 10));
    } else {
      setMaxPrice(100); // default max BGN (approx 50 EUR)
    }
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "" || value === "featured") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page pagination when filter changes
    params.delete("cursor");
    params.delete("h");
    router.push(`/shop?${params.toString()}`);
  }

  function handlePriceChange(val: number) {
    setMaxPrice(val);
  }

  function handlePriceCommit() {
    const params = new URLSearchParams(searchParams.toString());
    if (maxPrice >= 100) {
      params.delete("maxPrice");
    } else {
      params.set("maxPrice", String(maxPrice));
    }
    params.delete("cursor");
    params.delete("h");
    router.push(`/shop?${params.toString()}`);
  }

  // Convert BGN to EUR for display
  const maxPriceEur = maxPrice / 1.95583;

  return (
    <div className="w-full lg:w-64 shrink-0 bg-surface border border-border-c rounded-3xl p-6 space-y-8 h-fit">
      <div>
        <h3 className="font-heading font-extrabold text-lg text-text mb-4">Филтри</h3>
        <hr className="border-border-c/60" />
      </div>

      {/* 1. Price Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-text-muted uppercase tracking-wider">
          <span>Цена до</span>
          <span className="text-accent text-sm font-extrabold font-body">
            {maxPriceEur.toFixed(2).replace(".", ",")} €
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={maxPrice}
          onChange={(e) => handlePriceChange(parseInt(e.target.value, 10))}
          onMouseUp={handlePriceCommit}
          onTouchEnd={handlePriceCommit}
          className="w-full h-1.5 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between text-[10px] text-text-muted font-semibold">
          <span>5 €</span>
          <span>50 €+</span>
        </div>
      </div>

      {/* 2. Product Type (Categories) */}
      <div className="space-y-3">
        <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">
          Тип продукт
        </span>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => updateParam("category", "all")}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-left transition-all ${
              activeCategory === "all"
                ? "bg-accent/10 border border-accent/20 text-accent"
                : "bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text border border-transparent"
            }`}
          >
            <span>Всички аксесоари</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => updateParam("category", c.slug)}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-left transition-all ${
                activeCategory === c.slug
                  ? "bg-accent/10 border border-accent/20 text-accent"
                  : "bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text border border-transparent"
              }`}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Phone Model Dropdown */}
      {activeBrand !== "all" && availableModels.length > 0 && (
        <div className="space-y-3">
          <label htmlFor="sidebar-model" className="block text-xs font-bold text-text-muted uppercase tracking-wider">
            Модел телефон
          </label>
          <select
            id="sidebar-model"
            value={activeModel}
            onChange={(e) => updateParam("model", e.target.value)}
            className="w-full rounded-xl border border-border-c bg-surface-2 p-2.5 text-xs font-bold text-text outline-none focus:border-accent transition-colors"
          >
            <option value="">Всички модели</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear Filters Button */}
      {(activeCategory !== "all" || activeBrand !== "all" || activeModel !== "" || initialMaxPrice !== 100) && (
        <button
          onClick={() => {
            router.push("/shop");
          }}
          className="w-full rounded-full border border-border-c bg-surface-2 py-2.5 text-xs font-bold text-text-muted hover:text-text transition-all text-center"
        >
          Изчисти филтрите
        </button>
      )}
    </div>
  );
}
