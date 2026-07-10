import Link from "next/link";
import { brands } from "@/lib/data";
import { PhoneOutlineIcon } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <SectionHeading eyebrow="Пазарувай по марка" title="Намери аксесоари за твоя телефон" />
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-6 w-full">
        {brands
          .filter((b) => b.slug !== "other" && b.slug !== "diecast-cars")
          .map((b) => (
            <Link
              key={b.slug}
              href={`/brand/${b.slug}`}
              className="group flex aspect-[1.3/1] items-center justify-center rounded-2xl border border-border-c bg-surface p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 hover:border-accent/60"
              title={b.name}
            >
              {b.slug === "universal" ? (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-white">
                  <PhoneOutlineIcon className="w-6 h-6" />
                </span>
              ) : (
                <img
                  src={`/images/logos/${b.slug}.svg`}
                  alt={`${b.name} logo`}
                  className="h-10 lg:h-12 w-auto max-w-[90%] object-contain transition-transform group-hover:scale-105"
                />
              )}
            </Link>
          ))}
      </div>
    </section>
  );
}
