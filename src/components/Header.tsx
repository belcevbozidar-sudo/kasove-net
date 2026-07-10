"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { brands, categories } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "./Icons";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { itemCount, openDrawer } = useCart();
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop");
    setMobileOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-50">
        <div className="gradient-brand text-white">
          <p className="mx-auto max-w-7xl container-p py-2 text-center text-[11px] sm:text-xs font-medium">
            Безплатна доставка над 60&nbsp;лв. · Купи калъф&nbsp;+&nbsp;протектор в бъндел и спести до 20%
          </p>
        </div>

        <div className="border-b border-border-c bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 container-p py-3.5">
            <button
              className="rounded-lg p-2 hover:bg-surface lg:hidden"
              aria-label="Отвори меню"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            <Link href="/" className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight">
              Кейсове<span className="gradient-text">.нет</span>
            </Link>

            <form onSubmit={submitSearch} className="ml-4 hidden flex-1 max-w-lg items-center gap-2 rounded-full border border-border-c bg-surface px-4 py-2.5 lg:flex">
              <SearchIcon className="w-4 h-4 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Търси калъф, модел телефон, аксесоар..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
            </form>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
              <button
                className="rounded-lg p-2 hover:bg-surface lg:hidden"
                aria-label="Търсене"
                onClick={() => router.push("/shop")}
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <button onClick={openDrawer} className="relative rounded-lg p-2 hover:bg-surface" aria-label="Количка">
                <CartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent-2 px-1 text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <nav className="hidden lg:block border-t border-border-c bg-surface/60">
            <div className="mx-auto flex max-w-7xl items-center gap-6 container-p py-2.5 text-sm">
              {brands.filter((b) => b.slug !== "diecast-cars").map((b) => (
                <Link key={b.slug} href={`/brand/${b.slug}`} className="font-medium text-text-muted hover:text-accent-lime transition-colors">
                  {b.name}
                </Link>
              ))}
              <span className="ml-auto h-4 w-px bg-border-c" />
              {categories.filter((c) => c.slug !== "silicone-cases" && c.slug !== "hard-cases" && c.slug !== "leather-cases").map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} className="text-text-muted hover:text-accent-lime transition-colors text-xs font-semibold whitespace-nowrap">
                  {c.shortName}
                </Link>
              ))}
              <Link href="/shop" className="font-bold text-text hover:text-accent-lime text-xs whitespace-nowrap">
                Всички продукти
              </Link>
            </div>
          </nav>
        </div>
      </div>


      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-full max-w-xs overflow-y-auto bg-surface p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-heading text-lg font-extrabold">
                Кейсове<span className="gradient-text">.нет</span>
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Затвори" className="rounded-full p-2 hover:bg-surface-2">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitSearch} className="mb-6 flex items-center gap-2 rounded-full border border-border-c bg-surface-2 px-4 py-2.5">
              <SearchIcon className="w-4 h-4 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Търси..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
              />
            </form>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Марки</p>
            <ul className="mb-6 space-y-1">
              {brands.filter((b) => b.slug !== "diecast-cars").map((b) => (
                <li key={b.slug}>
                  <Link
                    href={`/brand/${b.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-2 py-2.5 font-medium hover:bg-surface-2"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Категории</p>
            <ul className="mb-6 space-y-1">
              {categories.filter((c) => c.slug !== "silicone-cases" && c.slug !== "hard-cases" && c.slug !== "leather-cases").map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-2 py-2.5 hover:bg-surface-2"
                  >
                    {c.shortName}
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="space-y-1 border-t border-border-c pt-4 text-sm text-text-muted">
              <li>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-2 py-2">За нас</Link>
              </li>
              <li>
                <Link href="/delivery" onClick={() => setMobileOpen(false)} className="block px-2 py-2">Доставка и плащане</Link>
              </li>
              <li>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-2 py-2">Контакти</Link>
              </li>
            </ul>
          </aside>
        </div>
      )}

      <CartDrawer />
    </>
  );
}
