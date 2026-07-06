"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

const slides: Slide[] = [
  {
    image: "/images/hero-collection.png",
    eyebrow: "Нова колекция",
    title: "Калъфи за всеки телефон, всеки стил",
    subtitle: "Apple, Samsung, Xiaomi, Huawei, Google и OnePlus — на едно място, на топ цени.",
    ctaLabel: "Пазарувай калъфи",
    ctaHref: "/shop?category=silicone-cases",
  },
  {
    image: "/images/hero-toys.jpg",
    eyebrow: "Метални макети",
    title: "Колекционерски колички и детски играчки",
    subtitle: "Изберете перфектния метален макет в мащаб 1:18, 1:24 или 1:32 на супер цена.",
    ctaLabel: "Разгледай количките",
    ctaHref: "/shop?category=toys",
  },
  {
    image: "/images/hero-lifestyle.png",
    eyebrow: "Стил и защита",
    title: "Кожени калъфи и аксесоари",
    subtitle: "Елегантни кожени калъфи тип тефтер с магнитно закопчаване и джобове за карти.",
    ctaLabel: "Разгледай кожени",
    ctaHref: "/shop?category=leather-cases",
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const id = setInterval(next, 5500);
    return () => clearInterval(id);
  }, [next]);

  const slide = slides[index];

  return (
    <section className="mx-auto max-w-7xl container-p pt-6">
      <div className="relative h-[420px] sm:h-[460px] lg:h-[560px] overflow-hidden rounded-3xl border border-border-c">
        {slides.map((s, i) => (
          <Image
            key={s.image}
            src={s.image}
            alt={s.title}
            fill
            priority
            sizes="100vw"
            className={`object-cover transition-opacity duration-700 ease-in-out ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-transparent" />

        <div key={index} className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 lg:p-14 animate-fade-up">
          <span className="mb-3 inline-block w-fit rounded-full gradient-brand px-3.5 py-1.5 text-xs font-semibold text-white">
            {slide.eyebrow}
          </span>
          <h1 className="max-w-xl font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
            {slide.title}
          </h1>
          <p className="mt-3 max-w-md text-sm sm:text-base text-white/80">{slide.subtitle}</p>
          <Link
            href={slide.ctaHref}
            className="mt-6 w-fit rounded-full gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
          >
            {slide.ctaLabel}
          </Link>
        </div>

        <button
          onClick={prev}
          aria-label="Предишен слайд"
          className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60 sm:block"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Следващ слайд"
          className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60 sm:block"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <div className="absolute bottom-5 right-6 z-10 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.image}
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-7 bg-accent-lime" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
