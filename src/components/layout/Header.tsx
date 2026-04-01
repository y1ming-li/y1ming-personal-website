import Image from "next/image";
import { NavLink } from "./NavLink";
import { navItems, siteConfig } from "@/data/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Image
          src="/logo_red.png"
          alt={siteConfig.name}
          height={32}
          width={120}
          className="object-contain"
          priority
        />
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
