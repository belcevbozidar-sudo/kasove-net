"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : ["/images/case-clear.webp"];
  const hasMultiple = gallery.length > 1;

  function goPrev() {
    setActive((a) => (a - 1 + gallery.length) % gallery.length);
  }

  function goNext() {
    setActive((a) => (a + 1) % gallery.length);
  }

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full overflow-hidden">
      <div className="group relative aspect-square overflow-hidden rounded-3xl border border-border-c bg-surface">
        <Image src={gallery[active]} alt={alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" priority />
        {hasMultiple && (
          <>
            <button
              onClick={goPrev}
              aria-label="Предишна снимка"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-text shadow-md backdrop-blur transition-opacity hover:bg-surface active:scale-95"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              aria-label="Следваща снимка"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-text shadow-md backdrop-blur transition-opacity hover:bg-surface active:scale-95"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      {hasMultiple && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin lg:grid lg:grid-cols-6 lg:overflow-visible">
          {gallery.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors lg:h-auto lg:w-full lg:aspect-square ${
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
