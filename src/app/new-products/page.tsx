import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { filterProducts } from "@/lib/products-server";
import { decodeCursor, decodeHistory, nextLinkParams, prevLinkParams } from "@/lib/pagination";

export const metadata = {
  title: "Нови продукти — Кейсове.нет",
};

interface NewProductsSearchParams {
  cursor?: string;
  h?: string;
}

function buildLink(overrides: { cursor: string; h: string }) {
  const params = new URLSearchParams();
  if (overrides.cursor && overrides.cursor !== "start") params.set("cursor", overrides.cursor);
  if (overrides.h) params.set("h", overrides.h);
  const qs = params.toString();
  return `/new-products${qs ? `?${qs}` : ""}`;
}

export default async function NewProductsPage({
  searchParams,
}: {
  searchParams: Promise<NewProductsSearchParams>;
}) {
  const sp = await searchParams;
  const history = decodeHistory(sp.h);
  const currentPage = history.length + 1;

  const res = await filterProducts({
    sort: "newest",
    cursor: decodeCursor(sp.cursor),
    numItems: 24,
  });

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> Нови продукти
      </nav>

      <h1 className="mb-1 font-heading text-3xl font-extrabold">Нови продукти</h1>
      <p className="mb-6 text-sm text-text-muted">
        {res.totalCount !== null ? `${res.totalCount} продукта · ` : ""}Страница {currentPage}
      </p>

      {res.products.length === 0 ? (
        <div className="rounded-3xl border border-border-c bg-surface p-16 text-center">
          <p className="text-text-muted font-medium text-lg">Все още няма добавени продукти.</p>
          <Link href="/shop" className="mt-5 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
            Разгледай магазина
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {res.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {(currentPage > 1 || !res.isDone) && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildLink(prevLinkParams(history))}
                  className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  ← Предишна
                </Link>
              ) : (
                <span className="rounded-xl border border-border-c bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted cursor-not-allowed">
                  ← Предишна
                </span>
              )}

              <span className="text-sm font-bold text-text px-4">
                Страница {currentPage}
              </span>

              {!res.isDone ? (
                <Link
                  href={buildLink(nextLinkParams(sp.cursor, history, res.continueCursor))}
                  className="rounded-xl border border-border-c bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2 transition-colors"
                >
                  Следваща →
                </Link>
              ) : (
                <span className="rounded-xl border border-border-c bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted cursor-not-allowed">
                  Следваща →
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
