"use client";

import { useState } from "react";

export default function DiscountBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-slow">
      <div className="relative group max-w-sm rounded-2xl p-0.5 bg-gradient-to-r from-accent to-accent-lime shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-lime opacity-30 blur-md group-hover:opacity-60 transition-opacity duration-300" />
        
        {/* Main Content Card */}
        <div className="relative bg-surface rounded-[14px] p-5 flex items-center gap-4">
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-text-muted hover:text-text transition-colors p-1"
            aria-label="Затвори"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badge element */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full gradient-brand text-white font-heading font-extrabold text-lg shadow-lg relative animate-pulse-slow">
            -50%
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-lime"></span>
            </span>
          </div>

          {/* Text content */}
          <div className="pr-4">
            <h4 className="font-heading font-extrabold text-sm text-text">
              ГОРЕЩА ОФЕРТА!
            </h4>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Всички мобилни аксесоари в момента са с <span className="font-bold text-accent">50% намаление</span>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
