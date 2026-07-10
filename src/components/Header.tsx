"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { brands, categories, allBrands, formatPrice } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from "./Icons";
import CartDrawer from "./CartDrawer";
import brandModelsData from "@/lib/models.json";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { itemCount, openDrawer } = useCart();
  const router = useRouter();

  const searchResult = useQuery(
    api.products.list,
    query.trim().length >= 2
      ? { q: query.trim(), paginationOpts: { numItems: 6, cursor: null } }
      : "skip"
  );
  const suggestions = searchResult?.page || [];

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

            {/* Desktop Autocomplete Search */}
            <div className="relative mx-8 hidden flex-1 lg:block">
              <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-border-c bg-surface px-4 py-2.5">
                <SearchIcon className="w-4 h-4 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  type="text"
                  placeholder="Търси калъф, модел телефон, аксесоар..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted text-text"
                />
              </form>

              {showDropdown && query.trim().length >= 2 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border-c bg-bg p-2.5 shadow-2xl max-h-[360px] overflow-y-auto">
                    {searchResult === undefined ? (
                      <div className="p-4 text-center text-xs text-text-muted">Търсене...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-text-muted">Няма намерени предложения</div>
                    ) : (
                      <div className="space-y-1">
                        {suggestions.map((p: any) => (
                          <Link
                            key={p.slug}
                            href={`/product/${p.slug}`}
                            onClick={() => {
                              setShowDropdown(false);
                              setQuery("");
                            }}
                            className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface transition-colors text-left"
                          >
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-2 overflow-hidden flex items-center justify-center border border-border-c">
                              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text truncate">{p.name}</p>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider">{p.brand} · {p.model}</p>
                            </div>
                            <span className="text-xs font-bold text-accent-lime shrink-0">
                              {formatPrice(p.price)}
                            </span>
                          </Link>
                        ))}
                        <div className="border-t border-border-c mt-2 pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
                              setShowDropdown(false);
                            }}
                            className="text-xs font-bold text-accent hover:underline"
                          >
                            Виж всички резултати за "{query}"
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

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

          <nav className="hidden lg:block border-t border-border-c bg-surface/90 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between container-p py-0 text-[13px] font-extrabold uppercase tracking-wide text-text relative">
              {/* Phone Brands (Main) */}
              {brands
                .filter((b) => b.slug !== "diecast-cars" && b.slug !== "other")
                .map((b) => {
                  const bModels = (brandModelsData as Record<string, string[]>)[b.slug] || [];
                  const isLeftEdge = b.slug === "apple" || b.slug === "samsung";
                  const dropdownAlignClass = isLeftEdge ? "left-0" : "left-1/2 -translate-x-1/2";
                  return (
                    <div key={b.slug} className="group py-4">
                      <Link
                        href={`/brand/${b.slug}`}
                        className="text-text hover:text-accent transition-colors flex items-center gap-1.5 py-1"
                      >
                        {b.name}
                        <svg className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Link>

                      {/* Dropdown Menu */}
                      {bModels.length > 0 && (
                        <div className="absolute left-0 right-0 w-full top-full z-[100] pt-2 hidden group-hover:block animate-fade-in">
                          <div className="w-full rounded-3xl border border-border-c bg-surface p-6 shadow-2xl">
                            <p className="text-sm font-extrabold text-accent uppercase tracking-wider mb-4 border-b border-border-c pb-2 text-left">
                              Популярни модели {b.name}
                            </p>
                            <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
                              {bModels.map((m) => (
                                <Link
                                  key={m}
                                  href={`/shop?brand=${b.slug}&model=${encodeURIComponent(m)}`}
                                  className="text-xs text-text hover:text-accent border border-border-c/70 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 py-2.5 px-4 rounded-xl transition-all font-bold text-left normal-case block truncate"
                                >
                                  {m}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Brand "Други" (Others) */}
              <div className="group py-4">
                <Link
                  href="/shop?brand=other"
                  className="text-text hover:text-accent transition-colors flex items-center gap-1.5 py-1"
                >
                  Други
                  <svg className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                
                {/* Dropdown of other brands */}
                <div className="absolute left-0 right-0 w-full top-full z-[100] pt-2 hidden group-hover:block animate-fade-in">
                  <div className="w-full rounded-3xl border border-border-c bg-surface p-6 shadow-2xl">
                    <p className="text-sm font-extrabold text-accent uppercase tracking-wider mb-4 border-b border-border-c pb-2 text-left">
                      Други марки телефони
                    </p>
                    <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
                      {allBrands
                        .filter(
                          (b: any) =>
                            !["apple", "samsung", "xiaomi", "honor", "motorola", "huawei", "universal", "other", "diecast-cars"].includes(b.slug)
                        )
                        .map((ob: any) => (
                          <Link
                            key={ob.slug}
                            href={`/brand/${ob.slug}`}
                            className="text-xs text-text hover:text-accent border border-border-c/70 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 py-2.5 px-3 rounded-xl transition-all font-bold text-left"
                          >
                            {ob.name}
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Аксесоари (Accessories) */}
              <div className="group py-4">
                <Link
                  href="/shop"
                  className="text-text hover:text-accent transition-colors flex items-center gap-1.5 py-1"
                >
                  Аксесоари
                  <svg className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                <div className="absolute left-0 right-0 w-full top-full z-[100] pt-2 hidden group-hover:block animate-fade-in">
                  <div className="w-full rounded-3xl border border-border-c bg-surface p-6 shadow-2xl">
                    <p className="text-sm font-extrabold text-accent uppercase tracking-wider mb-4 border-b border-border-c pb-2 text-left">
                      Категории аксесоари
                    </p>
                    <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
                      {categories.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/shop?category=${c.slug}`}
                          className="text-xs text-text hover:text-accent border border-border-c/70 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 py-2.5 px-4 rounded-xl transition-all font-bold text-left"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Метални колички (Diecast Cars) */}
              <div className="group relative py-4">
                <Link
                  href="/shop?brand=diecast-cars"
                  className="text-text hover:text-accent transition-colors flex items-center gap-1.5 py-1"
                >
                  Метални колички
                  <svg className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                <div className="absolute right-0 top-full z-[100] pt-2 hidden group-hover:block animate-fade-in">
                  <div className="w-72 rounded-3xl border border-border-c bg-surface p-4 shadow-2xl">
                    <p className="text-[10px] font-extrabold text-accent uppercase tracking-widest mb-3 border-b border-border-c pb-1.5 px-2 text-left">
                      Мащаби макети
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      {[
                        { label: "Всички колички", href: "/shop?brand=diecast-cars" },
                        { label: "Мащаб 1:18", href: "/shop?brand=diecast-cars&scale=1:18" },
                        { label: "Мащаб 1:24", href: "/shop?brand=diecast-cars&scale=1:24" },
                        { label: "Мащаб 1:32", href: "/shop?brand=diecast-cars&scale=1:32" },
                      ].map((sc) => (
                        <Link
                          key={sc.label}
                          href={sc.href}
                          className="text-xs text-text hover:text-accent border border-border-c/70 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 py-2.5 px-4 rounded-xl transition-all font-bold text-left"
                        >
                          {sc.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Всички продукти (All products) */}
              <div className="group relative py-4">
                <Link
                  href="/shop"
                  className="text-text hover:text-accent transition-colors flex items-center gap-1.5 py-1 font-extrabold text-accent"
                >
                  Всички продукти
                  <svg className="w-3 h-3 text-accent/80 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                <div className="absolute right-0 top-full z-[100] pt-2 hidden group-hover:block animate-fade-in">
                  <div className="w-64 rounded-3xl border border-border-c bg-surface p-4 shadow-2xl">
                    <p className="text-[10px] font-extrabold text-accent uppercase tracking-widest mb-3 border-b border-border-c pb-1.5 px-2 text-left">
                      Бързи линкове
                    </p>
                    <div className="flex flex-col gap-2 pt-1">
                      {[
                        { label: "Каталог продукти", href: "/shop" },
                        { label: "Топ Разпродажба", href: "/shop?sort=rating" },
                        { label: "Най-ниска цена", href: "/shop?sort=price-asc" },
                      ].map((l) => (
                        <Link
                          key={l.label}
                          href={l.href}
                          className="text-xs text-text hover:text-accent border border-border-c/70 hover:border-accent/60 bg-surface-2/40 hover:bg-accent/5 py-2.5 px-4 rounded-xl transition-all font-bold text-left"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Mobile Autocomplete Search */}
            <div className="relative mb-6">
              <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-border-c bg-surface-2 px-4 py-2.5">
                <SearchIcon className="w-4 h-4 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  type="text"
                  placeholder="Търси..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted text-text"
                />
              </form>

              {showDropdown && query.trim().length >= 2 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border-c bg-bg p-2.5 shadow-2xl max-h-[300px] overflow-y-auto">
                    {searchResult === undefined ? (
                      <div className="p-4 text-center text-xs text-text-muted">Търсене...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-text-muted">Няма намерени предложения</div>
                    ) : (
                      <div className="space-y-1">
                        {suggestions.map((p: any) => (
                          <Link
                            key={p.slug}
                            href={`/product/${p.slug}`}
                            onClick={() => {
                              setShowDropdown(false);
                              setMobileOpen(false);
                              setQuery("");
                            }}
                            className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface transition-colors text-left"
                          >
                            <div className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 overflow-hidden flex items-center justify-center border border-border-c">
                              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-text truncate">{p.name}</p>
                              <p className="text-[9px] text-text-muted uppercase tracking-wider">{p.brand} · {p.model}</p>
                            </div>
                            <span className="text-xs font-bold text-accent-lime shrink-0">
                              {formatPrice(p.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

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

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Раздели</p>
            <ul className="mb-6 space-y-1">
              <li>
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2.5 hover:bg-surface-2 font-medium"
                >
                  Аксесоари
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?brand=diecast-cars"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2.5 hover:bg-surface-2 font-medium"
                >
                  Метални колички
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2.5 hover:bg-surface-2 font-medium"
                >
                  Всички продукти
                </Link>
              </li>
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
