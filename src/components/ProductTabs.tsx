"use client";

import { useState } from "react";
import ProductCharacteristics from "./ProductCharacteristics";
import type { Product } from "@/lib/types";

export default function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<"description" | "specs">("description");

  const tabs = [
    { key: "description" as const, label: "Описание" },
    { key: "specs" as const, label: "Характеристики", mobileOnly: true },
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
        {tab === "description" && <p className="text-sm leading-relaxed text-text-muted whitespace-pre-line">{product.description}</p>}

        {/* Same content as the desktop right-column panel — this tab is mobile-only (hidden lg:hidden above) */}
        {tab === "specs" && (
          <div className="lg:hidden">
            <ProductCharacteristics product={product} />
          </div>
        )}
      </div>
    </div>
  );
}
