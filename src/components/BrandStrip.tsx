import Link from "next/link";
import { brands } from "@/lib/data";
import { PhoneOutlineIcon } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <SectionHeading eyebrow="Пазарувай по марка" title="Намери аксесоари за твоя телефон" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brand/${b.slug}`}
            className="group flex aspect-[1.3/1] items-center justify-center rounded-2xl border border-border-c bg-surface p-4 transition-all hover:-translate-y-1 hover:border-accent/60"
            title={b.name}
          >
            {b.slug === "universal" ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">
                <PhoneOutlineIcon className="w-5 h-5" />
              </span>
            ) : (
              <img
                src={`/images/logos/${b.slug}.svg`}
                alt={`${b.name} logo`}
                className="h-8 w-auto max-w-[85%] object-contain transition-transform group-hover:scale-105"
              />
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

