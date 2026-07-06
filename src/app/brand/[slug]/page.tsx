import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShopFilters from "@/components/ShopFilters";
import ProductCard from "@/components/ProductCard";
import { brands, getBrand, getCategory } from "@/lib/data";
import { filterProducts } from "@/lib/products-server";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  return { title: brand ? `${brand.name} аксесоари — Кейсове.нет` : "Кейсове.нет" };
}

interface BrandSearchParams {
  category?: string;
  sort?: string;
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<BrandSearchParams>;
}) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const { products: results } = filterProducts({ ...sp, brand: slug, limit: 1000 });
  const category = sp.category ? getCategory(sp.category) : undefined;

  return (
    <div className="mx-auto max-w-7xl container-p py-10">
      <nav className="mb-4 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span> {brand.name}
      </nav>

      <div className="mb-8 rounded-3xl border border-border-c bg-surface p-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">
          {brand.name} <span className="gradient-text">аксесоари</span>
        </h1>
        <p className="mt-2 text-text-muted">{brand.tagline} — калъфи, протектори и още, подбрани специално за твоя {brand.name} телефон.</p>
      </div>

      <p className="mb-4 text-sm text-text-muted">{category ? `${category.name} · ` : ""}{results.length} продукта</p>

      <Suspense fallback={null}>
        <ShopFilters basePath={`/brand/${slug}`} showBrands={false} />
      </Suspense>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-border-c bg-surface p-12 text-center">
          <p className="text-text-muted">Все още няма продукти в тази категория за {brand.name}.</p>
          <Link href={`/brand/${slug}`} className="mt-4 inline-block rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white">
            Изчисти филтъра
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
