"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  brandSlug: string;
  brandName: string;
  models: string[];
  categorySlug?: string;
}

export default function BrandModelSelector({ brandSlug, brandName, models, categorySlug }: Props) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const handleSelectModel = (model: string) => {
    const params = new URLSearchParams();
    params.set("brand", brandSlug);
    params.set("model", model);
    if (categorySlug) {
      params.set("category", categorySlug);
    }
    router.push(`/shop?${params.toString()}`);
  };

  const visibleModels = showAll ? models : models.slice(0, 24);

  return (
    <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-8 text-center animate-fade-up w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
          Изберете вашия модел
        </h2>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {visibleModels.map((m) => (
          <button
            key={m}
            onClick={() => handleSelectModel(m)}
            className="rounded-2xl border border-border-c/80 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 p-3.5 text-xs font-bold text-center text-text hover:text-accent transition-all shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer block truncate"
          >
            {m}
          </button>
        ))}
      </div>

      {/* Show All Toggle */}
      {models.length > 24 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mx-auto mt-8 flex items-center gap-2 rounded-full gradient-brand px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
        >
          Покажи всички модели ({models.length})
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
