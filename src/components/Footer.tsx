"use client";

import Link from "next/link";
import { useState } from "react";
import { brands, categories } from "@/lib/data";
import { CheckIcon } from "./Icons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-20 border-t border-border-c bg-surface">
      <div className="mx-auto max-w-7xl container-p py-10">
        <div className="rounded-2xl gradient-brand p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">-10% за първата ти поръчка</h3>
            <p className="text-white/85 text-sm mt-1">Абонирай се за нашия бюлетин и получи код за отстъпка веднага.</p>
          </div>
          {subscribed ? (
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-white font-semibold">
              <CheckIcon className="w-5 h-5" /> Благодарим! Провери имейла си.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setSubscribed(true);
              }}
              className="flex w-full max-w-md gap-2"
            >
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Твоят имейл"
                className="w-full rounded-full border-0 bg-white/95 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
              />
              <button className="shrink-0 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:brightness-125">
                Абонирай се
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl container-p grid grid-cols-2 gap-8 pb-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="font-heading text-xl font-extrabold">
            Кейсове<span className="gradient-text">.нет</span>
          </Link>
          <p className="mt-3 text-sm text-text-muted leading-relaxed">
            Оригинални калъфи, протектори и GSM аксесоари за всички водещи марки телефони. Бързо, сигурно и на изгодни бъндел цени.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Марки</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/brand/${b.slug}`} className="hover:text-accent-lime transition-colors">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Категории</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-accent-lime transition-colors">
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Помощ</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/delivery" className="hover:text-accent-lime transition-colors">Доставка и плащане</Link></li>
            <li><Link href="/about" className="hover:text-accent-lime transition-colors">За нас</Link></li>
            <li><Link href="/contact" className="hover:text-accent-lime transition-colors">Контакти</Link></li>
            <li><Link href="/cart" className="hover:text-accent-lime transition-colors">Количка</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Контакти</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li>bojidar453@abv.bg</li>
            <li>+359 88 123 4567</li>
            <li>София, България</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-c">
        <div className="mx-auto max-w-7xl container-p flex items-center justify-center py-5 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Кейсове.нет — Всички права запазени.</p>
        </div>
      </div>

    </footer>
  );
}
