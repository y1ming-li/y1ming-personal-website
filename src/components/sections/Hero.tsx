import { siteConfig, socialLinks } from "@/data/site";
import { ParticlePortrait } from "@/components/ui/ParticlePortrait";

export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-24 text-center"
    >
      <ParticlePortrait />
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-4 text-xl text-foreground/60">{siteConfig.title}</p>
      <p className="mt-6 max-w-xl text-foreground/70">{siteConfig.description}</p>
      <div className="mt-8 flex gap-4">
        {socialLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
