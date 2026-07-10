"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { categories, brands } from "@/lib/data";
import brandModelsData from "@/lib/models.json";

export default function CategoryLinks() {
  const router = useRouter();
  
  // State for the custom category flow wizard modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Update models list when brand changes
  useEffect(() => {
    if (selectedBrand) {
      const models = (brandModelsData as Record<string, string[]>)[selectedBrand] || [];
      setAvailableModels(models);
      setSelectedModel("");
    } else {
      setAvailableModels([]);
      setSelectedModel("");
    }
  }, [selectedBrand]);



  const handleCategoryClick = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setSelectedBrand(null);
    setSelectedModel("");
  };

  const handleFinishFlow = () => {
    if (selectedCategory && selectedBrand && selectedModel) {
      // Redirect to the shop with filters applied
      router.push(`/shop?brand=${selectedBrand}&model=${encodeURIComponent(selectedModel)}&category=${selectedCategory}`);
      // Reset state
      setSelectedCategory(null);
      setSelectedBrand(null);
      setSelectedModel("");
    }
  };

  const getCategoryName = (slug: string) => {
    return categories.find(c => c.slug === slug)?.name || "";
  };

  return (
    <section className="mx-auto max-w-7xl container-p py-10 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">Категории</span>
          <h2 className="text-2xl font-extrabold mt-1 text-text">Пазарувай по категория</h2>
        </div>
      </div>

      {/* Grid Container for Categories (2 rows of 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories
          .filter((c) => c.slug !== "car-stands")
          .map((c) => (
            <div
              key={c.slug}
              onClick={() => handleCategoryClick(c.slug)}
              className="group rounded-3xl border border-border-c bg-surface overflow-hidden hover:border-accent/60 transition-all hover:scale-[1.01] shadow-md hover:shadow-lg cursor-pointer"
            >
              {/* Aspect ratio 3:2 container */}
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={`/images/categories/${c.slug}.webp`}
                  alt={c.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                {/* Overlay text bottom */}
                <div className="absolute bottom-5 left-5 right-5 text-left">
                  <span className="text-[10px] font-bold text-accent-lime uppercase tracking-widest bg-accent-lime/10 px-2 py-0.5 rounded-full border border-accent-lime/20">
                    Аксесоар
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2 leading-tight">
                    {c.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Custom Category Selection Flow Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-3xl border border-border-c bg-surface p-6 sm:p-8 text-center shadow-2xl relative animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close modal */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedBrand(null);
                setSelectedModel("");
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text p-1 transition-colors"
              aria-label="Затвори"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="mb-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
              Избор на устройство
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">
              Изберете модел за {getCategoryName(selectedCategory)}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-text-muted max-w-md mx-auto">
              За да ви покажем точните аксесоари, моля изберете марката и модела на вашия телефон.
            </p>

            {/* Step 1: Select Brand */}
            <div className="mt-6 text-left">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                1. Изберете Марка
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {brands
                  .filter(b => b.slug !== "universal" && b.slug !== "other" && b.slug !== "diecast-cars")
                  .map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => setSelectedBrand(b.slug)}
                      className={`rounded-xl border p-3 text-xs font-semibold text-center transition-all ${
                        selectedBrand === b.slug
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-border-c bg-surface-2 hover:border-text-muted text-text-muted hover:text-text"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
              </div>
            </div>

            {/* Step 2: Select Model (Dropdown) */}
            {selectedBrand && (
              <div className="mt-6 text-left animate-fade-up">
                <label htmlFor="model-select" className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  2. Изберете Модел телефон
                </label>
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-xl border border-border-c bg-surface-2 p-3 text-sm font-semibold text-text outline-none focus:border-accent transition-colors"
                >
                  <option value="">-- Изберете модел --</option>
                  {availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Finish Action */}
            <div className="mt-8 border-t border-border-c/60 pt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  setSelectedModel("");
                }}
                className="rounded-full border border-border-c px-5 py-2.5 text-xs font-bold text-text-muted hover:text-text hover:bg-surface-2 transition-all"
              >
                Отказ
              </button>
              <button
                disabled={!selectedCategory || !selectedBrand || !selectedModel}
                onClick={handleFinishFlow}
                className="rounded-full gradient-brand px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Виж продуктите →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
