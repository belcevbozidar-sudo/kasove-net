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
          return (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="flex shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-border-c bg-surface px-5 py-4 text-center transition-colors hover:border-accent/60 sm:shrink"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-accent-lime">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">{c.shortName}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
