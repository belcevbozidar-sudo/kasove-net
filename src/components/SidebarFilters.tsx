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
  const activeScale = searchParams.get("scale") ?? "all";
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full lg:w-64 shrink-0">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:hidden flex items-center justify-between rounded-3xl border border-border-c bg-surface px-5 py-3.5 text-sm font-bold text-text mb-4"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Филтри {(activeCategory !== "all" || activeBrand !== "all" || activeModel !== "" || activeScale !== "all" || initialMaxPrice !== 100) ? "(активни)" : ""}
        </span>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filters Container */}
      <div className={`w-full lg:w-64 shrink-0 bg-surface border border-border-c rounded-3xl p-6 space-y-8 h-fit lg:block ${isOpen ? "block animate-fade-in" : "hidden"}`}>
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

      {/* 2. Product Type (Categories or Scale if Diecast) */}
      <div className="space-y-3">
        <span className="block text-xs font-bold text-text-muted uppercase tracking-wider">
          Тип продукт
        </span>
        <div className="flex flex-col gap-2">
          {activeBrand === "diecast-cars" ? (
            <>
              <button
                onClick={() => updateParam("scale", "all")}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-left transition-all ${
                  activeScale === "all"
                    ? "bg-accent/10 border border-accent/20 text-accent"
                    : "bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text border border-transparent"
                }`}
              >
                <span>Всички мащаби</span>
              </button>
              {[
                { slug: "1-18", name: "Мащаб 1:18" },
                { slug: "1-24", name: "Мащаб 1:24" },
                { slug: "1-32", name: "Мащаб 1:32" },
                { slug: "1-36", name: "Мащаб 1:36" },
                { slug: "1-43", name: "Мащаб 1:43" },
                { slug: "1-64", name: "Мащаб 1:64" },
              ].map((s) => (
                <button
                  key={s.slug}
                  onClick={() => updateParam("scale", s.slug)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-left transition-all ${
                    activeScale === s.slug
                      ? "bg-accent/10 border border-accent/20 text-accent"
                      : "bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text border border-transparent"
                  }`}
                >
                  <span>{s.name}</span>
                </button>
              ))}
            </>
          ) : (
            <>
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
            </>
          )}
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
      {(activeCategory !== "all" || activeBrand !== "all" || activeModel !== "" || activeScale !== "all" || initialMaxPrice !== 100) && (
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
    </div>
  );
}
