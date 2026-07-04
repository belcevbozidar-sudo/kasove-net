import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";

export default function ProductRail({
  title,
  eyebrow,
  subtitle,
  href,
  products,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  href?: string;
  products: Product[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} href={href} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
