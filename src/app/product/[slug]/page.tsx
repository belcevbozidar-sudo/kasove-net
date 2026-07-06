import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductTabs from "@/components/ProductTabs";
import ProductRail from "@/components/ProductRail";
import { getBrand, getCategory } from "@/lib/data";
import { getBundleProduct, getProductBySlug, getRelatedProducts } from "@/lib/products-server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product ? `${product.name} — ${product.model} | Кейсове.нет` : "Кейсове.нет" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const brand = getBrand(product.brand);
  const category = getCategory(product.category);
  const bundleProduct = getBundleProduct(product);
  const related = getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl container-p py-10 pb-28 sm:pb-10">
      <nav className="mb-6 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Начало</Link> <span className="mx-1">/</span>
        <Link href={`/brand/${product.brand}`} className="hover:text-text">{brand?.name}</Link> <span className="mx-1">/</span>
        <Link href={`/shop?category=${product.category}`} className="hover:text-text">{category?.shortName}</Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.gallery} alt={product.name} />
        <ProductPurchasePanel product={product} bundleProduct={bundleProduct} />
      </div>

      <ProductTabs product={product} />

      <ProductRail eyebrow="Може да хареса" title="Свързани продукти" products={related} />
    </div>
  );
}
