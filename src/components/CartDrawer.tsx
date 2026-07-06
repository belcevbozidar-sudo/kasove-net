"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/data";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";

export default function CartDrawer() {
  const { lines, isDrawerOpen, closeDrawer, setQuantity, removeItem, subtotal, bundleSavings, itemCount } = useCart();

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-border-c px-5 py-4">
          <h2 className="font-heading text-lg font-bold">Количка ({itemCount})</h2>
          <button onClick={closeDrawer} aria-label="Затвори количката" className="rounded-full p-2 hover:bg-surface-2">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-text-muted">Количката е празна.</p>
            <Link
              href="/shop"
              onClick={closeDrawer}
              className="rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Разгледай продукти
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border-c px-5 py-3">
              {remainingForFreeShipping > 0 ? (
                <p className="text-xs text-text-muted">
                  Добави още <span className="text-accent-lime font-semibold">{formatPrice(remainingForFreeShipping)}</span> за безплатна доставка
                </p>
              ) : (
                <p className="text-xs font-semibold text-success">Имаш право на безплатна доставка 🎉</p>
              )}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full gradient-brand rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {lines.map((line) => {
                return (
                  <div key={`${line.productId}-${line.bundleProductId ?? "solo"}`} className="flex gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      <Image src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-snug">{line.name}</p>
                          <p className="text-xs text-text-muted">{line.model}</p>
                          {line.isBundleDiscounted && (
                            <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-lime">
                              Бъндел отстъпка
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(line.productId)}
                          aria-label="Премахни"
                          className="text-text-muted hover:text-sale"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-full border border-border-c px-2 py-1">
                          <button
                            onClick={() => setQuantity(line.productId, line.quantity - 1)}
                            className="text-text-muted hover:text-text"
                            aria-label="Намали количеството"
                          >
                            <MinusIcon className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-4 text-center text-xs font-semibold">{line.quantity}</span>
                          <button
                            onClick={() => setQuantity(line.productId, line.quantity + 1)}
                            className="text-text-muted hover:text-text"
                            aria-label="Увеличи количеството"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold">{formatPrice(line.price * line.quantity)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border-c px-5 py-4 space-y-3">
              {bundleSavings > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Бъндел спестявания</span>
                  <span>-{formatPrice(bundleSavings)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading text-lg font-bold">
                <span>Общо</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block w-full rounded-full gradient-brand py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                Към количката
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
