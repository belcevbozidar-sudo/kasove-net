"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import type { Product, BrandSlug, CategorySlug, Badge } from "@/lib/types";

interface Props {
  currentSlug: string;
}

export default function RecentlyViewed({ currentSlug }: Props) {
  const [slugsToShow, setSlugsToShow] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentlyViewedSlugs");
      let list: string[] = stored ? JSON.parse(stored) : [];

      // Remove current slug if exists, then add to front
      list = list.filter((s) => s !== currentSlug);
      list.unshift(currentSlug);

      // Keep maximum 6 items stored
      list = list.slice(0, 6);
      localStorage.setItem("recentlyViewedSlugs", JSON.stringify(list));

      // Filter out the current slug for display
      const filtered = list.filter((s) => s !== currentSlug).slice(0, 4);
      setSlugsToShow(filtered);
    } catch (e) {
      console.error("Failed to read/write recently viewed slugs:", e);
    }
  }, [currentSlug]);

  // Fetch product documents from Convex
  const docs = useQuery(
    api.products.getManyBySlugs,
    slugsToShow.length > 0 ? { slugs: slugsToShow } : "skip"
  );

  if (!docs || docs.length === 0) return null;

  // Convert Doc<"products"> to Product
  const products: Product[] = docs.map((doc: any) => {
    const { _id, _creationTime, sourceId, hasOldPrice, ...rest } = doc;
    return {
      id: sourceId,
      ...rest,
      brand: rest.brand as BrandSlug,
      category: rest.category as CategorySlug,
      badge: rest.badge as Badge | undefined,
    };
  });


  return (
    <section className="mx-auto max-w-7xl container-p py-10 mt-6 border-t border-border-c/50">
      <SectionHeading eyebrow="История" title="Последно разгледани" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
