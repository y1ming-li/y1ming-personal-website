"use client";

import { useState } from "react";
import Image from "next/image";
import { HamburgerMenu } from "./HamburgerMenu";
import { siteConfig } from "@/data/site";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* 3-column grid: left | center (max-w-5xl) | right — logo sits at right edge of left col */}
        <div className="grid h-14" style={{ gridTemplateColumns: '1fr min(64rem, 100%) 1fr' }}>
          <div className="flex items-center justify-end">
            <Image
              src="/image/logo_red.png"
              alt={siteConfig.name}
              height={32}
              width={120}
              className={`object-contain transition-opacity duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
              priority
            />
          </div>
          <div />
          <div />
        </div>
      </header>

      {/* Fixed container — must be outside <header> to sit above the HamburgerMenu overlay (z-[100]).
          Mirrors the same 3-column grid; button sits at left edge of right col. */}
      <div className="fixed top-0 inset-x-0 z-[110] pointer-events-none">
        <div className="grid h-14" style={{ gridTemplateColumns: '1fr min(64rem, 100%) 1fr' }}>
          <div />
          <div />
          <div className="flex items-center justify-start pl-8 pt-5">
            <button
              onClick={() => setIsOpen((v) => !v)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              className="group pointer-events-auto flex flex-col justify-center items-center w-8 h-8 gap-1.5 cursor-pointer"
            >
              {/* Bar 1 — rotates to top arm of × */}
              <span
                className={`block h-0.5 w-6 transition-all duration-300 ease-in-out origin-center ${
                  isOpen
                    ? "rotate-45 translate-y-[8px] bg-black group-hover:bg-white"
                    : "bg-accent"
                }`}
              />
              {/* Bar 2 — fades out */}
              <span
                className={`block h-0.5 w-6 transition-all duration-300 ease-in-out ${
                  isOpen ? "opacity-0 bg-black" : "bg-accent"
                }`}
              />
              {/* Bar 3 — rotates to bottom arm of × */}
              <span
                className={`block h-0.5 w-6 transition-all duration-300 ease-in-out origin-center ${
                  isOpen
                    ? "-rotate-45 -translate-y-[8px] bg-black group-hover:bg-white"
                    : "bg-accent"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <HamburgerMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
