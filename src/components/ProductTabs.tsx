"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import ProductCharacteristics from "./ProductCharacteristics";
import type { Product } from "@/lib/types";

const reviewSamples = [
  { name: "Стефан К.", days: 4, text: "Прилягането е перфектно, изрезите за камерата съвпадат точно. Много добро качество за цената." },
  { name: "Яна М.", days: 11, text: "Поръчах с протектора в бъндел — дойде бързо и наистина спестих. Препоръчвам!" },
  { name: "Николай Р.", days: 22, text: "Издръжлив материал, не се хлъзга от ръка. Точно каквото очаквах от снимките." },
];

export default function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<"description" | "specs" | "reviews">("description");

  const tabs = [
    { key: "description" as const, label: "Описание" },
    { key: "specs" as const, label: "Характеристики", mobileOnly: true },
    { key: "reviews" as const, label: `Отзиви (${product.reviewCount})` },
  ];

  return (
    <div className="mt-12">
      <div className="flex gap-6 border-b border-border-c">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative pb-3 text-sm font-semibold transition-colors ${t.mobileOnly ? "lg:hidden" : ""} ${
              tab === t.key ? "text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute -bottom-px left-0 h-0.5 w-full gradient-brand rounded-full" />}
          </button>
        ))}
      </div>

      <div className="py-6 max-w-2xl">
        {tab === "description" && <p className="text-sm leading-relaxed text-text-muted">{product.description}</p>}

        {/* Same content as the desktop right-column panel — this tab is mobile-only (hidden lg:hidden above) */}
        {tab === "specs" && (
          <div className="lg:hidden">
            <ProductCharacteristics product={product} />
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="font-heading text-3xl font-extrabold">{product.rating.toFixed(1)}</span>
              <div>
                <StarRating rating={product.rating} size="md" />
                <p className="text-xs text-text-muted mt-0.5">{product.reviewCount} отзива</p>
              </div>
            </div>
            <div className="space-y-4">
              {reviewSamples.map((r) => (
                <div key={r.name} className="rounded-2xl border border-border-c bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-text-muted">преди {r.days} дни</p>
                  </div>
                  <StarRating rating={5} />
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
