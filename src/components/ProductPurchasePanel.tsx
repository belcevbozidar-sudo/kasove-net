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
  bundleProducts = [],
}: {
  product: Product;
  bundleProducts?: Product[];
}) {
  const { addItem, openDrawer } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const brand = getBrand(product.brand);
  const discountPct = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;

  function handleAddToCart() {
    addItem(product, quantity);
    setJustAdded(true);
    openDrawer();
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  function handleAddProtectorToCart(protector: Product) {
    addItem(product, quantity);
    addItem(protector, 1, { id: product.id, bundleWith: protector.id, bundleDiscountPct: 20 });
    openDrawer();
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
          {justAdded ? "Добавено ✓" : `Добави в количката · ${formatPrice(product.price * quantity)}`}
        </button>
      </div>

      {bundleProducts.length > 0 && (
        <div className="mt-4 border-t border-border-c pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide text-text flex items-center gap-1.5">
              🛡️ Купете и протектор:
            </h3>
            <span className="rounded-full gradient-brand px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Спести 20%
            </span>
          </div>
          
          <div className="grid gap-2 grid-cols-1">
            {bundleProducts.map((p) => {
              const discountedPrice = p.price * 0.8;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-c bg-surface p-2.5 transition-all hover:border-accent/40 hover:shadow-sm">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-c bg-white">
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-text line-clamp-1 leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        <span className="line-through mr-1.5">{formatPrice(p.price)}</span>
                        <span className="font-extrabold text-accent-lime">{formatPrice(discountedPrice)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProtectorToCart(p)}
                    className="shrink-0 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent hover:gradient-brand hover:text-white transition-all text-center cursor-pointer"
                  >
                    Добави
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          <span className="font-heading text-lg font-bold">{formatPrice(product.price * quantity)}</span>
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
