import { TruckIcon, ReturnIcon, LockIcon, CheckIcon } from "@/components/Icons";
import { formatPrice, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE } from "@/lib/data";

export const metadata = { title: "Доставка и плащане — Кейсове.нет" };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-4xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent-lime">Информация</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">Доставка и плащане</h1>

      <div className="mt-10 space-y-6">
        <section className="rounded-2xl border border-border-c bg-surface p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent-lime">
              <TruckIcon className="w-5 h-5" />
            </span>
            <h2 className="font-heading text-lg font-bold">Доставка</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            <li className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-accent-lime" />
              Доставяме до адрес или до офис на Еконт и Спиди в цялата страна за 24-48 часа.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-accent-lime" />
              Безплатна доставка при поръчка над {formatPrice(FREE_SHIPPING_THRESHOLD)}.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-accent-lime" />
              Стандартна цена на доставка: {formatPrice(DEFAULT_SHIPPING_FEE)}.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border-c bg-surface p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent-lime">
              <LockIcon className="w-5 h-5" />
            </span>
            <h2 className="font-heading text-lg font-bold">Плащане</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            <li className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-accent-lime" />
              Наложен платеж — плащаш в брой на куриера при получаване.
            </li>
            <li className="flex items-start gap-2.5">
              <CheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-accent-lime" />
              Плащане с дебитна/кредитна карта онлайн, чрез сигурна връзка.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border-c bg-surface p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent-lime">
              <ReturnIcon className="w-5 h-5" />
            </span>
            <h2 className="font-heading text-lg font-bold">Връщане и рекламации</h2>
          </div>
          <p className="mt-4 text-sm text-text-muted leading-relaxed">
            Разполагаш с 30 дни от получаването на пратката, за да върнеш продукт, който не отговаря на очакванията ти
            — без излишни въпроси. Продуктът трябва да е в оригиналното си състояние и опаковка.
          </p>
        </section>
      </div>
    </div>
  );
}
