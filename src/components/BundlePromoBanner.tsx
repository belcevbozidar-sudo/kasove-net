import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "./Icons";

export default function BundlePromoBanner() {
  return (
    <section className="mx-auto max-w-7xl container-p py-14">
      <div className="grid overflow-hidden rounded-3xl border border-border-c bg-surface lg:grid-cols-2">
        <div className="relative order-2 h-64 lg:order-1 lg:h-full">
          <Image src="/images/bundle-promo.png" alt="Калъф и протектор бъндел" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="order-1 flex flex-col justify-center gap-4 p-8 sm:p-12 lg:order-2">
          <span className="w-fit rounded-full bg-accent-lime/15 px-3.5 py-1.5 text-xs font-semibold text-accent-lime">
            Умна оферта
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold leading-tight">
            Калъф <span className="gradient-text">+</span> Протектор <span className="gradient-text">= -20%</span>
          </h2>
          <p className="text-text-muted max-w-md">
            Всеки калъф в Кейсове.нет идва с препоръчан протектор за екрана на същия модел. Добавѝ и двата в количката с едно кликване и вземи протектора с до 20% отстъпка.
          </p>
          <ul className="space-y-2.5 text-sm">
            {[
              "Пълна 360° защита на телефона",
              "Автоматична отстъпка в количката",
              "Оригинални материали и прецизно прилягане",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/shop?category=cases"
            className="mt-2 w-fit rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
          >
            Избери своя бъндел
          </Link>
        </div>
      </div>
    </section>
  );
}
