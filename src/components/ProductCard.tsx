"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/data";
import { formatModelDisplay } from "@/lib/format-model";
import type { Product } from "@/lib/types";
import StarRating from "./StarRating";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const discountPct = product.oldPrice
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : null;
  const outOfStock = product.inStock === false;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border-c bg-surface overflow-hidden transition-colors hover:border-accent/50">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-surface-2 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {outOfStock ? (
            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              Неналичен
            </span>
          ) : (
            <>
              {product.badge && (
                <span className="rounded-full gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  {product.badge}
                </span>
              )}
              {discountPct && (
                <span className="rounded-full bg-sale px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  -{discountPct}%
                </span>
              )}
            </>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <span className="text-[11px] uppercase tracking-wide text-text-muted">
          {formatModelDisplay(product.brand, product.model)}
        </span>
        <Link href={`/product/${product.slug}`} className="font-heading text-sm font-semibold leading-snug line-clamp-3 hover:text-accent transition-colors">
          {product.name}
        </Link>
        <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        {product.sku && (
          <p className="text-[10px] text-text-muted">
            <span className={outOfStock ? "text-sale font-semibold" : "text-success font-semibold"}>
              {outOfStock ? "Неналичен" : "В наличност"}
            </span>
            {" · Арт. № "}
            {product.sku}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-text-muted line-through">{formatPrice(product.oldPrice)}</span>
            )}
            <span className="font-heading text-lg font-bold">{formatPrice(product.price)}</span>
          </div>
          {outOfStock ? (
            <span className="rounded-full bg-surface-2 px-3.5 py-2 text-xs font-semibold text-text-muted">
              Очаква се доставка
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                addItem(product, 1);
              }}
              className="rounded-full gradient-brand px-3.5 py-2 text-xs font-semibold text-white transition-transform active:scale-95 hover:brightness-110"
            >
              + Количка
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
