import Link from "next/link";
import { brands } from "@/lib/data";
import { PhoneOutlineIcon } from "./Icons";
import SectionHeading from "./SectionHeading";

const BRAND_STYLES: Record<string, { bg: string; text: string }> = {
  apple: { bg: "from-zinc-900 to-zinc-800 border-zinc-700/50 hover:shadow-zinc-500/10", text: "text-zinc-400" },
  samsung: { bg: "from-blue-950/40 to-indigo-950/30 border-blue-900/30 hover:shadow-blue-500/10", text: "text-blue-400" },
  xiaomi: { bg: "from-orange-950/40 to-amber-950/30 border-orange-900/30 hover:shadow-orange-500/10", text: "text-orange-400" },
  huawei: { bg: "from-red-950/40 to-rose-950/30 border-red-900/30 hover:shadow-red-500/10", text: "text-red-400" },
  honor: { bg: "from-teal-950/40 to-emerald-950/30 border-teal-900/30 hover:shadow-teal-500/10", text: "text-teal-400" },
  motorola: { bg: "from-sky-950/40 to-cyan-950/30 border-sky-900/30 hover:shadow-sky-500/10", text: "text-sky-400" },
  universal: { bg: "from-violet-950/40 to-pink-950/30 border-violet-900/30 hover:shadow-violet-500/10", text: "text-violet-400" },
};

export default function BrandStrip() {
  return (
    <section className="mx-auto max-w-7xl container-p py-10">
      <SectionHeading eyebrow="Пазарувай по марка" title="Намери аксесоари за твоя телефон" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 w-full">
        {brands
          .filter((b) => b.slug !== "other" && b.slug !== "diecast-cars")
          .map((b) => {
            const style = BRAND_STYLES[b.slug] || {
              bg: "from-zinc-900 to-zinc-850 border-zinc-800 hover:shadow-zinc-700/10",
              text: "text-zinc-400",
            };
            return (
              <Link
                key={b.slug}
                href={`/brand/${b.slug}`}
                className={`group relative flex aspect-[1.3/1] flex-col items-center justify-between rounded-3xl border bg-gradient-to-br p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03] overflow-hidden ${style.bg}`}
                title={b.name}
              >
                {/* Glowing Mesh background decor */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/10 opacity-30 group-hover:opacity-50 transition-opacity" />

                <div className="flex-1 flex items-center justify-center w-full">
                  {b.slug === "universal" ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
                      <PhoneOutlineIcon className="w-6 h-6" />
                    </span>
                  ) : (
                    <img
                      src={`/images/logos/${b.slug}.svg`}
                      alt={`${b.name} logo`}
                      className="h-10 lg:h-12 w-auto max-w-[85%] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300 brightness-110 contrast-125"
                    />
                  )}
                </div>

                {/* Text label underneath */}
                <span className={`text-[10px] font-extrabold uppercase tracking-widest mt-2 group-hover:text-white transition-colors duration-300 ${style.text}`}>
                  {b.name}
                </span>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
