"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscountBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
      <div 
        onClick={() => router.push("/shop?category=all")}
        className="relative w-28 h-28 group cursor-pointer"
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute -top-1 -right-1 z-20 bg-surface border border-border-c text-text-muted hover:text-text rounded-full p-1.5 shadow-md transition-colors"
          aria-label="Затвори"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Outer Rotating Dashed Circle */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent animate-spin-slow opacity-80 group-hover:border-accent-lime transition-colors duration-300" />
        
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent to-accent-lime opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300" />

        {/* Inner Solid Circle Badge */}
        <div className="absolute inset-2.5 rounded-full bg-surface border border-border-c flex flex-col items-center justify-center text-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden">
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent pointer-events-none" />
          
          <span className="text-2xl font-black gradient-text tracking-tighter relative z-10 leading-none">
            -50%
          </span>
          <span className="text-[9px] font-black text-text uppercase tracking-widest leading-none mt-1.5 relative z-10">
            Супер
          </span>
          <span className="text-[8px] font-bold text-accent-lime uppercase tracking-wider leading-none mt-0.5 relative z-10">
            Намаление
          </span>
          
          {/* Animated pulsing dot indicator */}
          <span className="absolute bottom-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime"></span>
          </span>
        </div>
      </div>
    </div>
  );
}
