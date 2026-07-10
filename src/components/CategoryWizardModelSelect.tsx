"use client";

import { useRouter } from "next/navigation";

interface Props {
  spCategory?: string;
  spBrand?: string;
  models: string[];
}

export default function CategoryWizardModelSelect({ spCategory, spBrand, models }: Props) {
  const router = useRouter();

  const handleChange = (val: string) => {
    if (val) {
      const queryStr = new URLSearchParams();
      if (spCategory) queryStr.set("category", spCategory);
      if (spBrand) queryStr.set("brand", spBrand);
      queryStr.set("model", val);
      router.push(`/shop?${queryStr.toString()}`);
    }
  };

  return (
    <select
      onChange={(e) => handleChange(e.target.value)}
      className="w-full rounded-xl border border-border-c bg-surface px-4 py-3.5 text-sm font-semibold text-text outline-none focus:border-accent transition-colors"
      defaultValue=""
    >
      <option value="" disabled>-- Изберете модел телефон --</option>
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
