"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getBrand } from "@/lib/data";
import type { Product } from "@/lib/types";
import StarRating from "./StarRating";
import { CheckIcon, MinusIcon, PlusIcon, ShieldIcon, TruckIcon, LockIcon } from "./Icons";

export default function ProductPurchasePanel({
  product,
  bundleProduct,
}: {
  product: Product;
  bundleProduct?: Product;
}) {
  const { addItem, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [includeBundle, setIncludeBundle] = useState(Boolean(bundleProduct));
  const [justAdded, setJustAdded] = useState(false);

  const brand = getBrand(product.brand);
  const discountPct = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;

  const bundleDiscountedPrice = useMemo(() => {
    if (!bundleProduct || !product.bundleDiscountPct) return null;
    return bundleProduct.price * (1 - product.bundleDiscountPct / 100);
  }, [bundleProduct, product.bundleDiscountPct]);

  const combinedTotal =
    product.price * quantity + (includeBundle && bundleDiscountedPrice !== null ? bundleDiscountedPrice * quantity : 0);
  const bundleSavingsTotal =
    includeBundle && bundleProduct && bundleDiscountedPrice !== null
      ? (bundleProduct.price - bundleDiscountedPrice) * quantity
      : 0;

  function handleAddToCart() {
    addItem(product.id, quantity);
    if (bundleProduct && includeBundle) {
      addItem(bundleProduct.id, quantity, product.id);
    }
    setJustAdded(true);
    openDrawer();
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {brand?.name} · {product.model}
        </span>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold leading-tight">{product.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <StarRating rating={product.rating} reviewCount={product.reviewCount} size="md" />
          {product.badge && (
            <span className="rounded-full gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white">{product.badge}</span>
          )}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <span className="font-heading text-3xl font-extrabold">{formatPrice(product.price)}</span>
        {product.oldPrice && (
          <>
            <span className="text-base text-text-muted line-through">{formatPrice(product.oldPrice)}</span>
            <span className="rounded-full bg-sale/15 px-2.5 py-1 text-xs font-semibold text-sale">-{discountPct}%</span>
          </>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {product.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
            <CheckIcon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-accent-lime" />
            {f}
          </li>
        ))}
      </ul>

      {bundleProduct && bundleDiscountedPrice !== null && (
        <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-accent/10 to-accent-2/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white">
              Умна оферта
            </span>
            <span className="text-xs font-semibold text-accent-lime">
              -{product.bundleDiscountPct}% на протектора
            </span>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={includeBundle}
              onChange={(e) => setIncludeBundle(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded accent-[var(--accent)]"
            />
            <div className="flex flex-1 items-center gap-3">
              <div className="flex -space-x-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-surface bg-surface-2">
                  <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
                </div>
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border-2 border-surface bg-surface-2">
                  <Image src={bundleProduct.image} alt={bundleProduct.name} fill sizes="48px" className="object-cover" />
                </div>
              </div>
              <div className="text-sm">
                <p className="font-semibold leading-snug">Добави {bundleProduct.name}</p>
                <p className="text-xs text-text-muted">
                  <span className="line-through">{formatPrice(bundleProduct.price)}</span>{" "}
                  <span className="font-semibold text-accent-lime">{formatPrice(bundleDiscountedPrice)}</span>
                </p>
              </div>
            </div>
          </label>

          {includeBundle && (
            <div className="mt-3 flex items-center justify-between border-t border-accent/20 pt-3 text-sm">
              <span className="text-text-muted">Общо за комплекта</span>
              <span className="font-heading font-bold">
                {formatPrice(combinedTotal)}{" "}
                <span className="text-xs font-normal text-success">(спестяваш {formatPrice(bundleSavingsTotal)})</span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-border-c px-3 py-2">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Намали" className="text-text-muted hover:text-text">
            <MinusIcon className="w-4 h-4" />
          </button>
          <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)} aria-label="Увеличи" className="text-text-muted hover:text-text">
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          className="hidden flex-1 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] hover:brightness-110 sm:block"
        >
          {justAdded ? "Добавено ✓" : `Добави в количката · ${formatPrice(combinedTotal)}`}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-text-muted">
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border-c p-3">
          <TruckIcon className="w-4 h-4 text-accent-lime" /> Доставка 24-48ч.
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border-c p-3">
          <ShieldIcon className="w-4 h-4 text-accent-lime" /> 30 дни връщане
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border-c p-3">
          <LockIcon className="w-4 h-4 text-accent-lime" /> Сигурно плащане
        </div>
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border-c bg-surface/95 p-3 backdrop-blur sm:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-text-muted">Общо</span>
          <span className="font-heading text-lg font-bold">{formatPrice(combinedTotal)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 rounded-full gradient-brand py-3 text-sm font-semibold text-white active:scale-[0.98]"
        >
          {justAdded ? "Добавено ✓" : "Добави в количката"}
        </button>
      </div>

      <p className="text-center text-xs text-text-muted sm:text-left">
        Имаш въпрос? <Link href="/contact" className="text-accent-lime hover:underline">Свържи се с нас</Link>
      </p>
    </div>
  );
}
