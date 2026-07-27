"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const gallery = images.length > 0 ? images : ["/images/case-clear.webp"];
  const hasMultiple = gallery.length > 1;

  function goPrev() {
    setActive((a) => (a - 1 + gallery.length) % gallery.length);
  }

  function goNext() {
    setActive((a) => (a + 1) % gallery.length);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full overflow-hidden">
      <div className="group relative aspect-square overflow-hidden rounded-3xl border border-border-c bg-surface">
        <button
          onClick={() => setLightboxOpen(true)}
          aria-label="Уголеми снимката"
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image src={gallery[active]} alt={alt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" priority />
        </button>
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

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-10">
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Затвори"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          <div
            className="relative h-full w-full max-w-4xl"
            onClick={() => setLightboxOpen(false)}
          >
            <Image
              src={gallery[active]}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Предишна снимка"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Следваща снимка"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
