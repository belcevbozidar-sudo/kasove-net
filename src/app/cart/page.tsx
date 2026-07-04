"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice, getBestSellers, getProductById, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE } from "@/lib/data";
import { MinusIcon, PlusIcon, TrashIcon, CartIcon } from "@/components/Icons";
import ProductRail from "@/components/ProductRail";
import { useState } from "react";

export default function CartPage() {
  const { lines, setQuantity, removeItem, subtotal, bundleSavings, itemCount } = useCart();
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : DEFAULT_SHIPPING_FEE;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const suggestions = getBestSellers(4).filter((p) => !lines.some((l) => l.productId === p.id));

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl container-p py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted">
          <CartIcon className="w-7 h-7" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold">Количката е празна</h1>
        <p className="mt-2 text-text-muted">Разгледай продуктите ни и намери перфектния аксесоар за телефона си.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white">
          Разгледай продукти
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <h1 className="mb-6 font-heading text-3xl font-extrabold">Количка ({itemCount})</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {lines.map((line) => {
            const product = getProductById(line.productId);
            if (!product) return null;
            const anchor = line.bundleProductId ? getProductById(line.bundleProductId) : undefined;
            const isBundleDiscounted = Boolean(anchor && anchor.bundleWith === product.id && anchor.bundleDiscountPct);
            const unitPrice = isBundleDiscounted
              ? product.price * (1 - (anchor!.bundleDiscountPct as number) / 100)
              : product.price;

            return (
              <div key={`${line.productId}-${line.bundleProductId ?? "solo"}`} className="flex gap-4 rounded-2xl border border-border-c bg-surface p-4">
                <Link href={`/product/${product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${product.slug}`} className="font-heading font-semibold hover:text-accent transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-xs text-text-muted mt-0.5">{product.model}</p>
                      {isBundleDiscounted && (
                        <span className="mt-1.5 inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent-lime">
                          Бъндел отстъпка -{anchor?.bundleDiscountPct}%
                        </span>
                      )}
                    </div>
                    <button onClick={() => removeItem(line.productId)} aria-label="Премахни" className="text-text-muted hover:text-sale">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3 rounded-full border border-border-c px-3 py-1.5">
                      <button onClick={() => setQuantity(line.productId, line.quantity - 1)} aria-label="Намали" className="text-text-muted hover:text-text">
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                      <button onClick={() => setQuantity(line.productId, line.quantity + 1)} aria-label="Увеличи" className="text-text-muted hover:text-text">
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      {isBundleDiscounted && (
                        <span className="block text-xs text-text-muted line-through">{formatPrice(product.price * line.quantity)}</span>
                      )}
                      <span className="font-heading font-bold">{formatPrice(unitPrice * line.quantity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit space-y-4 rounded-2xl border border-border-c bg-surface p-5 lg:sticky lg:top-28">
          {remainingForFreeShipping > 0 ? (
            <div>
              <p className="text-xs text-text-muted">
                Добави още <span className="font-semibold text-accent-lime">{formatPrice(remainingForFreeShipping)}</span> за безплатна доставка
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full gradient-brand rounded-full transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-success">Имаш право на безплатна доставка 🎉</p>
          )}

          <div className="flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Промо код"
              className="w-full rounded-full border border-border-c bg-surface-2 px-4 py-2.5 text-sm outline-none"
            />
            <button
              onClick={() => setPromoMsg(promo.trim() ? "Кодът не е валиден или е изтекъл." : null)}
              className="shrink-0 rounded-full border border-border-c px-4 py-2.5 text-sm font-semibold hover:bg-surface-2"
            >
              Приложи
            </button>
          </div>
          {promoMsg && <p className="text-xs text-sale">{promoMsg}</p>}

          <div className="space-y-2 border-t border-border-c pt-4 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Междинна сума</span>
              <span>{formatPrice(subtotal + bundleSavings)}</span>
            </div>
            {bundleSavings > 0 && (
              <div className="flex justify-between text-success">
                <span>Бъндел спестявания</span>
                <span>-{formatPrice(bundleSavings)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Доставка</span>
              <span>{shipping === 0 ? "Безплатна" : formatPrice(shipping)}</span>
            </div>
          </div>

          <div className="flex justify-between border-t border-border-c pt-4 font-heading text-lg font-bold">
            <span>Общо</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="block w-full rounded-full gradient-brand py-3.5 text-center text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Продължи към поръчка
          </Link>
          <Link href="/shop" className="block text-center text-xs text-text-muted hover:text-text">
            Продължи пазаруването
          </Link>
        </div>
      </div>

      {suggestions.length > 0 && (
        <ProductRail eyebrow="Може да добавиш" title="Често купувани заедно" products={suggestions.slice(0, 4)} />
      )}
    </div>
  );
}
