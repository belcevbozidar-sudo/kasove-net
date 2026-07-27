import type { Product } from "@/lib/types";
import { CheckIcon } from "./Icons";

export default function ProductCharacteristics({ product }: { product: Product }) {
  if (product.features.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 font-heading text-sm font-extrabold uppercase tracking-wide text-text">
        Характеристики
      </h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {product.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-text-muted">
            <CheckIcon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-accent-lime" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
