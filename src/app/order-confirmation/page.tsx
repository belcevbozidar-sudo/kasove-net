"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon, TruckIcon } from "@/components/Icons";
import { formatPrice } from "@/lib/data";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order") ?? "KN-000000";
  const total = Number(searchParams.get("total") ?? 0);

  return (
    <div className="mx-auto max-w-xl container-p py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon className="w-9 h-9" />
      </div>
      <h1 className="font-heading text-3xl font-extrabold">Благодарим за поръчката!</h1>
      <p className="mt-2 text-text-muted">
        Поръчка <span className="font-semibold text-text">#{order}</span> е приета и вече се обработва.
      </p>

      <div className="mt-8 rounded-2xl border border-border-c bg-surface p-6 text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent-lime">
            <TruckIcon className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Очаквана доставка: 1-2 работни дни</p>
            <p className="text-xs text-text-muted">Ще получиш SMS с проследяващ номер, когато пратката бъде изпратена.</p>
          </div>
        </div>
        {total > 0 && (
          <div className="mt-4 flex justify-between border-t border-border-c pt-4 text-sm">
            <span className="text-text-muted">Обща сума</span>
            <span className="font-heading font-bold">{formatPrice(total)}</span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/shop" className="rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white">
          Продължи пазаруването
        </Link>
        <Link href="/" className="rounded-full border border-border-c px-6 py-3 text-sm font-semibold hover:bg-surface">
          Начална страница
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  );
}
