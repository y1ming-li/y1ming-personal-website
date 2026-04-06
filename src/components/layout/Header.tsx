"use client";

import { useState } from "react";
import Image from "next/image";
import { HamburgerMenu } from "./HamburgerMenu";
import { siteConfig } from "@/data/site";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Logo fades out while the overlay is open */}
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
      </header>

      {/* Fixed container mirrors the header layout so the button stays aligned */}
      <div className="fixed top-0 inset-x-0 z-[110] pointer-events-none">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-end px-4">
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

      <HamburgerMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
