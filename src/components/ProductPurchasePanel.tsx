"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/data";
import { formatModelDisplay } from "@/lib/format-model";
import type { Product } from "@/lib/types";
import { EyeIcon, PlusIcon, ShieldIcon, TruckIcon, LockIcon } from "./Icons";
import QuickOrderModal from "./QuickOrderModal";
import ProductCharacteristics from "./ProductCharacteristics";

const BUNDLE_VISIBLE_LIMIT = 4;

export default function ProductPurchasePanel({
  product,
  bundleProducts = [],
}: {
  product: Product;
  bundleProducts?: Product[];
}) {
  const { addItem, addBundle, openDrawer } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [showAllBundles, setShowAllBundles] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const discountPct = product.oldPrice ? Math.round(100 - (product.price / product.oldPrice) * 100) : null;
  const outOfStock = product.inStock === false;
  const bundleDiscountPct = product.bundleDiscountPct ?? 20;
  const visibleBundleProducts = showAllBundles ? bundleProducts : bundleProducts.slice(0, BUNDLE_VISIBLE_LIMIT);

  function handleAddToCart() {
    addItem(product, 1);
    setJustAdded(true);
    openDrawer();
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  function handleAddProtectorToCart(protector: Product) {
    addBundle(product, protector, product.bundleDiscountPct ?? 20);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {formatModelDisplay(product.brand, product.model)}
        </span>
        <h1 className="mt-1 font-heading text-2xl sm:text-3xl font-extrabold leading-tight">{product.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          {outOfStock ? (
            <span className="rounded-full bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-white">Неналичен</span>
          ) : (
            product.badge && (
              <span className="rounded-full gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white">{product.badge}</span>
            )
          )}
        </div>
      </div>

      {outOfStock ? (
        <p className="text-sm font-semibold text-sale">
          Неналичен · очаква се доставка
          {product.sku && <span className="text-text-muted font-normal"> · Арт. № {product.sku}</span>}
        </p>
      ) : (
        product.sku && (
          <p className="text-sm">
            <span className="font-semibold text-success">В наличност</span>
            <span className="text-text-muted"> · Арт. № {product.sku}</span>
          </p>
        )
      )}

      <div className="flex items-end gap-3">
        <span className="font-heading text-3xl font-extrabold">{formatPrice(product.price)}</span>
        {product.oldPrice && (
          <>
            <span className="text-base text-text-muted line-through">{formatPrice(product.oldPrice)}</span>
            <span className="rounded-full bg-sale/15 px-2.5 py-1 text-xs font-semibold text-sale">-{discountPct}%</span>
          </>
        )}
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="flex-1 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {outOfStock ? "Очаква се доставка" : justAdded ? "Добавено ✓" : `Добави в количката · ${formatPrice(product.price)}`}
        </button>
        <button
          onClick={() => setQuickOrderOpen(true)}
          disabled={outOfStock}
          className="shrink-0 rounded-full border border-border-c px-5 py-3.5 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Бърза поръчка
        </button>
      </div>

      {bundleProducts.length > 0 && (
        <div className="mt-4 border-t border-border-c pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-extrabold uppercase tracking-wide text-text flex items-center gap-1.5">
              🛡️ Купете и протектор:
            </h3>
            <span className="rounded-full gradient-brand px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
              Спести {bundleDiscountPct}%
            </span>
          </div>

          <div className="grid gap-2 grid-cols-1">
            {visibleBundleProducts.map((p) => {
              const discountedPrice = p.price * (1 - bundleDiscountPct / 100);
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-border-c bg-surface p-2.5 transition-all hover:border-accent/40 hover:shadow-sm">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border-c bg-white">
                      <Image src={product.image} alt={product.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <PlusIcon className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border-c bg-white">
                      <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 ml-1">
                      <h4 className="text-xs font-bold text-text line-clamp-1 leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        <span className="line-through mr-1.5">{formatPrice(p.price)}</span>
                        <span className="font-extrabold text-accent-lime">{formatPrice(discountedPrice)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/product/${p.slug}`}
                      aria-label={`Разгледай ${p.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-c text-text-muted hover:border-accent/40 hover:text-accent transition-all"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleAddProtectorToCart(p)}
                      disabled={p.inStock === false}
                      className="shrink-0 rounded-lg bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent hover:gradient-brand hover:text-white transition-all text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent/10 disabled:hover:text-accent"
                    >
                      {p.inStock === false ? "Неналичен" : "Добави"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {bundleProducts.length > BUNDLE_VISIBLE_LIMIT && !showAllBundles && (
            <button
              onClick={() => setShowAllBundles(true)}
              className="mt-2 w-full rounded-xl border border-border-c py-2 text-xs font-bold text-text-muted hover:border-accent/40 hover:text-accent transition-all"
            >
              Покажи всички ({bundleProducts.length})
            </button>
          )}
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

      {/* Characteristics — desktop only; on mobile the same content lives in the tab below the gallery */}
      <div className="hidden lg:block border-t border-border-c pt-6">
        <ProductCharacteristics product={product} />
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border-c bg-surface/95 p-3 backdrop-blur sm:hidden">
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] text-text-muted">Общо</span>
          <span className="font-heading text-lg font-bold">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={() => setQuickOrderOpen(true)}
          disabled={outOfStock}
          className="shrink-0 rounded-full border border-border-c px-3.5 py-3 text-xs font-semibold text-text active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Бърза поръчка
        </button>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="flex-1 rounded-full gradient-brand py-3 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Очаква се доставка" : justAdded ? "Добавено ✓" : "Добави в количката"}
        </button>
      </div>

      <p className="text-center text-xs text-text-muted sm:text-left">
        Имаш въпрос? <Link href="/contact" className="text-accent-lime hover:underline">Свържи се с нас</Link>
      </p>

      <QuickOrderModal
        product={product}
        open={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
      />
    </div>
  );
}
