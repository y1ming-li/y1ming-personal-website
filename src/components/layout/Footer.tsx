import { socialLinks, siteConfig } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-foreground/60">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex gap-4">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground/60 transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
