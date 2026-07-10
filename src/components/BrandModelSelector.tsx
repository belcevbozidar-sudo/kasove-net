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

  const visibleModels = showAll ? models : models.slice(0, 10);

  return (
    <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-10 text-center animate-fade-up max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col items-center justify-center">
        <span className="mb-2 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
          Избор на устройство
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
          Изберете вашия модел {brandName}
        </h2>
        <p className="mt-2 text-sm text-text-muted max-w-md">
          Изберете модела на вашия телефон от списъка по-долу, за да покажем съвместимите аксесоари.
        </p>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {visibleModels.map((m) => (
          <button
            key={m}
            onClick={() => handleSelectModel(m)}
            className="rounded-2xl border border-border-c/80 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 p-5 text-sm font-bold text-center text-text hover:text-accent transition-all shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer block truncate"
          >
            {m}
          </button>
        ))}
      </div>

      {/* Show All Toggle */}
      {models.length > 10 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mx-auto mt-8 flex items-center gap-2 rounded-full gradient-brand px-7 py-3 text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          Покажи всички модели ({models.length})
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
