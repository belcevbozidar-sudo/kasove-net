import Link from "next/link";
import { brands } from "@/lib/data";
import { PhoneOutlineIcon, ChevronRightIcon } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl container-p py-14">
      <SectionHeading eyebrow="Пазарувай по марка" title="Намери аксесоари за твоя телефон" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brand/${b.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border border-border-c bg-surface p-5 transition-all hover:-translate-y-1 hover:border-accent/60"
          >
            <div className="flex h-10 items-center justify-start">
              {b.slug === "universal" ? (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
                  <PhoneOutlineIcon className="w-5 h-5" />
                </span>
              ) : (
                <img
                  src={`/images/logos/${b.slug}.svg`}
                  alt={`${b.name} logo`}
                  className="h-8 w-auto max-w-[130px] object-contain object-left transition-transform group-hover:scale-105"
                />
              )}
            </div>
            <div>
              <p className="font-heading font-bold">{b.name}</p>
              <p className="text-xs text-text-muted">{b.tagline}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-accent-lime opacity-0 transition-opacity group-hover:opacity-100">
              Пазарувай <ChevronRightIcon className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
