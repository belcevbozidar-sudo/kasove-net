import Link from "next/link";
import { brands, categories } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border-c bg-surface pt-12">

      <div className="mx-auto max-w-7xl container-p grid grid-cols-2 gap-8 pb-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="font-heading text-xl font-extrabold">
            Кейсове<span className="gradient-text">.нет</span>
          </Link>
          <p className="mt-3 text-sm text-text-muted leading-relaxed">
            Оригинални калъфи, протектори и GSM аксесоари за всички водещи марки телефони. Бързо, сигурно и на изгодни бъндел цени.
          </p>
          <div className="mt-4 text-xs text-text-muted space-y-1">
            <p><strong>Тел:</strong> <a href="tel:0893664799" className="hover:text-accent-lime">0893/66 47 99</a></p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Марки</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/brand/${b.slug}`} className="hover:text-accent-lime transition-colors">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Категории</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-accent-lime transition-colors">
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Помощ</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/delivery" className="hover:text-accent-lime transition-colors">Доставка и плащане</Link></li>
            <li><Link href="/about" className="hover:text-accent-lime transition-colors">За нас</Link></li>
            <li><Link href="/contact" className="hover:text-accent-lime transition-colors">Контакти</Link></li>
            <li><Link href="/cart" className="hover:text-accent-lime transition-colors">Количка</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Политики</h4>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/terms" className="hover:text-accent-lime transition-colors">Общи условия</Link></li>
            <li><Link href="/privacy" className="hover:text-accent-lime transition-colors">Лични данни (GDPR)</Link></li>
            <li><Link href="/returns" className="hover:text-accent-lime transition-colors">Връщане на продукти</Link></li>
            <li><Link href="/cookies" className="hover:text-accent-lime transition-colors">Бисквитки</Link></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-border-c">
        <div className="mx-auto max-w-7xl container-p flex items-center justify-center py-5 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} Кейсове.нет — Всички права запазени.</p>
        </div>
      </div>

    </footer>
  );
}
