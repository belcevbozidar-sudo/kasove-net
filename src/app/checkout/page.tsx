"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatPrice, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE } from "@/lib/data";
import { LockIcon } from "@/components/Icons";

export default function CheckoutPage() {
  const { lines, subtotal, bundleSavings, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<"address" | "office">("address");
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [submitting, setSubmitting] = useState(false);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : DEFAULT_SHIPPING_FEE;
  const total = subtotal + shipping;

  if (lines.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-3xl container-p py-20 text-center">
        <h1 className="font-heading text-2xl font-extrabold">Количката е празна</h1>
        <p className="mt-2 text-text-muted">Добави продукти, преди да продължиш към поръчка.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white">
          Разгледай продукти
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const orderNumber = `KN-${Math.floor(100000 + (total * 37 + itemCount * 91) % 900000)}`;
    const totalParam = total.toFixed(2);
    clearCart();
    router.push(`/order-confirmation?order=${orderNumber}&total=${totalParam}`);
  }

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <h1 className="mb-6 font-heading text-3xl font-extrabold">Поръчка</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border-c bg-surface p-5">
            <h2 className="mb-4 font-heading font-bold">Данни за контакт</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Име" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
              <input required placeholder="Фамилия" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
              <input required type="tel" placeholder="Телефон" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
              <input required type="email" placeholder="Имейл" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
            </div>
          </div>

          <div className="rounded-2xl border border-border-c bg-surface p-5">
            <h2 className="mb-4 font-heading font-bold">Начин на доставка</h2>
            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod("address")}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  deliveryMethod === "address" ? "border-accent bg-accent/10" : "border-border-c text-text-muted"
                }`}
              >
                До адрес
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("office")}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  deliveryMethod === "office" ? "border-accent bg-accent/10" : "border-border-c text-text-muted"
                }`}
              >
                До офис (Еконт / Спиди)
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required placeholder="Град" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent sm:col-span-1" />
              <input
                required
                placeholder={deliveryMethod === "address" ? "Адрес (улица, номер)" : "Име на офис"}
                className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent sm:col-span-1"
              />
              <textarea
                placeholder="Бележка към поръчката (по избор)"
                rows={2}
                className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent sm:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-c bg-surface p-5">
            <h2 className="mb-4 font-heading font-bold">Начин на плащане</h2>
            <div className="space-y-3">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${payment === "cod" ? "border-accent bg-accent/10" : "border-border-c"}`}>
                <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="accent-[var(--accent)]" />
                <span className="text-sm font-medium">Наложен платеж</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${payment === "card" ? "border-accent bg-accent/10" : "border-border-c"}`}>
                <input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} className="accent-[var(--accent)]" />
                <span className="text-sm font-medium">Дебитна / Кредитна карта</span>
              </label>
            </div>
          </div>
        </div>

        <div className="h-fit space-y-4 rounded-2xl border border-border-c bg-surface p-5 lg:sticky lg:top-28">
          <h2 className="font-heading font-bold">Обобщение ({itemCount})</h2>
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {lines.map((line) => {
              return (
                <div key={`${line.productId}-${line.bundleProductId ?? "solo"}`} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    <Image src={line.image} alt={line.name} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-medium leading-snug line-clamp-1">{line.name}</p>
                    <p className="text-text-muted">Бр: {line.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold">{formatPrice(line.price * line.quantity)}</span>
                </div>
              );
            })}
          </div>

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

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full gradient-brand py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <LockIcon className="w-4 h-4" /> Завърши поръчката
          </button>
          <p className="text-center text-[11px] text-text-muted">Демо поръчка — не се извършва реално плащане.</p>
        </div>
      </form>
    </div>
  );
}
