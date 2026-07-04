import Link from "next/link";
import { ChevronRightIcon } from "./Icons";

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  hrefLabel = "Виж всички",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-accent-lime">
            {eyebrow}
          </span>
        )}
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-text-muted max-w-xl">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="hidden sm:flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-lime hover:brightness-110">
          {hrefLabel} <ChevronRightIcon className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
