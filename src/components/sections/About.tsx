import { SectionHeading } from "@/components/ui/SectionHeading";

export function About() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title="About" />
        <p className="text-foreground/70 leading-relaxed">
          {/* TODO: add bio */}
          This is the about section. Add your bio here.
        </p>
      </div>
    </section>
  );
}
