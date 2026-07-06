import { redirect } from "next/navigation";
import { brands, getBrand } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  return { title: brand ? `${brand.name} аксесоари — Кейсове.нет` : "Кейсове.нет" };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<any>;
}) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const sp = await searchParams;
  const urlParams = new URLSearchParams();
  urlParams.set("brand", slug);
  if (sp.category) urlParams.set("category", sp.category);
  if (sp.sort) urlParams.set("sort", sp.sort);
  if (sp.q) urlParams.set("q", sp.q);
  if (sp.model) urlParams.set("model", sp.model);
  if (sp.scale) urlParams.set("scale", sp.scale);
  if (sp.cursor) urlParams.set("cursor", sp.cursor);
  if (sp.h) urlParams.set("h", sp.h);

  redirect(`/shop?${urlParams.toString()}`);
}
