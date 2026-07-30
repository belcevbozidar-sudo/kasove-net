import Link from "next/link";
import { brands } from "@/lib/data";
import SectionHeading from "./SectionHeading";

// Brands with a generated background photo at /images/brands/<slug>.jpg —
// any brand not in this set falls back to a themed gradient below.
const BRAND_PHOTO_SLUGS = new Set(["apple", "samsung", "xiaomi", "honor", "motorola", "huawei", "nokia", "realme"]);
const BRAND_GRADIENTS: Record<string, string> = {
  nokia: "from-cyan-500/70 via-sky-900 to-zinc-950",
  realme: "from-amber-400/70 via-amber-900 to-zinc-950",
};

export default function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <SectionHeading eyebrow="Пазарувай по марка" title="Намери аксесоари за твоя телефон" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8 w-full">
        {brands
          .filter((b) => b.slug !== "other" && b.slug !== "diecast-cars")
          .map((b) => {
            return (
              <Link
                key={b.slug}
                href={`/brand/${b.slug}`}
                className="group relative flex aspect-[1.45/1] flex-col items-center justify-between rounded-[2rem] border border-zinc-800/80 bg-zinc-950 p-6 shadow-xl hover:shadow-2xl hover:border-zinc-700/80 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] overflow-hidden"
                title={b.name}
              >
                {/* Generated Brand Image Background, or a themed gradient for brands without one yet */}
                {BRAND_PHOTO_SLUGS.has(b.slug) ? (
                  <img
                    src={`/images/brands/${b.slug}.jpg`}
                    alt={`${b.name} background`}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${BRAND_GRADIENTS[b.slug] ?? "from-zinc-700 to-zinc-950"} opacity-70 group-hover:opacity-85 transition-all duration-500`}
                  />
                )}

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                <div className="relative z-10 flex-1 flex items-center justify-center w-full" />

                {/* Text label underneath */}
                <span className="relative z-10 text-sm font-black uppercase tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-auto group-hover:text-accent transition-colors duration-300">
                  {b.name}
                </span>
              </Link>

            );
          })}
      </div>
    </section>
  );
}
