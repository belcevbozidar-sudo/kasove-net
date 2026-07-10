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
    <div className="rounded-3xl border border-border-c bg-surface p-6 sm:p-8 text-left animate-fade-up w-full">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
          Изберете вашия модел
        </h2>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-2">
        {visibleModels.map((m) => (
          <button
            key={m}
            onClick={() => handleSelectModel(m)}
            className="text-left text-[13px] font-bold text-text-muted hover:text-accent py-1 transition-all hover:translate-x-1.5 duration-200 cursor-pointer block truncate"
          >
            • {m}
          </button>
        ))}
      </div>

      {/* Show All Toggle */}
      {models.length > 24 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-xs font-extrabold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
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

