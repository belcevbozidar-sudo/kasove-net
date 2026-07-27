"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatPrice } from "@/lib/data";
import type { Product } from "@/lib/types";
import { CloseIcon } from "./Icons";

export default function QuickOrderModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const createOrder = useMutation(api.orders.createOrder);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    setOrderNumber(null);
    setError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await createOrder({
        type: "quick",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        items: [
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image,
          },
        ],
        subtotal: product.price,
        shipping: 0,
        total: product.price,
      });
      setOrderNumber(result.orderNumber);
    } catch {
      setError("Възникна грешка. Моля, опитайте отново или се обадете на телефона за поръчки.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-surface p-5 shadow-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Бърза поръчка</h2>
          <button onClick={handleClose} aria-label="Затвори" className="rounded-full p-2 hover:bg-surface-2">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {orderNumber ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="font-heading text-xl font-bold text-success">Поръчката е приета!</p>
            <p className="text-sm text-text-muted">
              Номер на поръчката: <span className="font-semibold text-text">{orderNumber}</span>
            </p>
            <p className="text-sm text-text-muted">Ще се свържем с теб на посочения телефон, за да потвърдим поръчката.</p>
            <button
              onClick={handleClose}
              className="mt-3 rounded-full gradient-brand px-6 py-2.5 text-sm font-semibold text-white"
            >
              Готово
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border-c bg-surface-2 p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug line-clamp-2">{product.name}</p>
                <p className="mt-0.5 text-sm font-bold text-accent">{formatPrice(product.price)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Име"
                className="w-full rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Фамилия"
                className="w-full rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефонен номер"
                className="w-full rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent"
              />

              <label className="flex items-start gap-2.5 pt-1 text-xs text-text-muted cursor-pointer">
                <input
                  required
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-c accent-[var(--accent)] cursor-pointer"
                />
                <span>
                  Съгласен съм с{" "}
                  <Link href="/terms" target="_blank" className="text-accent-lime hover:underline">
                    Общите условия
                  </Link>{" "}
                  и{" "}
                  <Link href="/privacy" target="_blank" className="text-accent-lime hover:underline">
                    обработката на личните ми данни
                  </Link>
                  .
                </span>
              </label>

              {error && <p className="text-xs text-sale">{error}</p>}

              <button
                type="submit"
                disabled={!agreed || submitting}
                className="w-full rounded-full gradient-brand py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Изпращане..." : "Изпрати поръчка"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
