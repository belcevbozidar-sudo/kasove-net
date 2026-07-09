"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : ["/images/case-clear.png"];

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full overflow-hidden">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border-c bg-surface">
        <Image src={gallery[active]} alt={alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" priority />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {gallery.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                active === i ? "border-accent" : "border-border-c"
              }`}
            >
              <Image src={img} alt={`${alt} ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
