"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/Icons";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-5xl container-p py-14">
      <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-accent-lime">Контакти</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-extrabold">Свържи се с нас</h1>
      <p className="mt-3 max-w-lg text-text-muted">
        Имаш въпрос за продукт, поръчка или бъндел оферта? Пиши ни — отговаряме в рамките на работния ден.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border-c bg-surface p-5">

            <p className="text-xs text-text-muted">Телефон за поръчки</p>
            <p className="font-semibold">0893/66 47 99</p>
          </div>
          <div className="rounded-2xl border border-border-c bg-surface p-5">
            <p className="text-xs text-text-muted">Физически магазин</p>
            <p className="font-semibold">Няма физически магазин (само онлайн поръчки)</p>
          </div>
          <div className="rounded-2xl border border-border-c bg-surface p-5">
            <p className="text-xs text-text-muted">Работно време</p>
            <p className="font-semibold">Пон-Пет: 10:00 - 19:00ч. | Събота: 10:00 - 17:30ч.</p>
          </div>

        </div>

        <div className="lg:col-span-3">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-border-c bg-surface p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckIcon className="w-7 h-7" />
              </span>
              <p className="font-heading text-lg font-bold">Съобщението е изпратено!</p>
              <p className="text-sm text-text-muted">Ще се свържем с теб възможно най-скоро.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-4 rounded-2xl border border-border-c bg-surface p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input required placeholder="Име" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
                <input required type="email" placeholder="Имейл" className="rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
              </div>
              <input placeholder="Тема" className="w-full rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent" />
              <textarea
                required
                rows={5}
                placeholder="Съобщение"
                className="w-full rounded-xl border border-border-c bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent"
              />
              <button className="w-full rounded-full gradient-brand py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] sm:w-auto sm:px-8">
                Изпрати съобщение
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
