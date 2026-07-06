import Link from "next/link";
import { categories } from "@/lib/data";
import {
  PhoneOutlineIcon,
  ShieldIcon,
  BoltIcon,
  CableIcon,
  EarbudsIcon,
  BatteryIcon,
  StandIcon,
} from "./Icons";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  case: PhoneOutlineIcon,
  shield: ShieldIcon,
  bolt: BoltIcon,
  cable: CableIcon,
  earbuds: EarbudsIcon,
  battery: BatteryIcon,
  stand: StandIcon,
};

export default function CategoryLinks() {
  return (
    <section className="mx-auto max-w-7xl container-p py-6">
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 lg:grid-cols-7">
        {categories.map((c) => {
          const Icon = iconMap[c.icon] ?? PhoneOutlineIcon;
          const isToys = c.slug === "toys";
          return (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className={`relative flex shrink-0 flex-col items-center gap-2.5 rounded-2xl border px-5 py-4 text-center transition-all sm:shrink ${
                isToys 
                  ? "border-accent-lime/80 bg-surface shadow-[0_0_15px_rgba(163,230,53,0.15)] hover:border-accent-lime scale-[1.03]" 
                  : "border-border-c bg-surface hover:border-accent/60"
              }`}
            >
              {isToys && (
                <span className="absolute -top-2 -right-1.5 flex h-4 items-center justify-center rounded-full bg-accent-lime px-1.5 text-[9px] font-bold text-bg uppercase tracking-wider animate-pulse">
                  Хит
                </span>
              )}
              <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                isToys ? "bg-accent-lime/10 text-accent-lime" : "bg-surface-2 text-accent-lime"
              }`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className={`text-xs font-semibold whitespace-nowrap ${isToys ? "text-accent-lime font-bold" : ""}`}>{c.shortName}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
