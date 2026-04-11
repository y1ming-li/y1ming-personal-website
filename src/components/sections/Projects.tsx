import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { projects } from "@/data/projects";

// Fallback grid view (used when 3D canvas is unavailable)
export function Projects() {
  return (
    <section id="projects" className="py-24 px-4 bg-foreground/[0.02]">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title="Projects"
          subtitle="A selection of things I've built."
        />
        {projects.length === 0 ? (
          <p className="text-foreground/50">Projects coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.slug}
                className="rounded-xl border border-foreground/10 p-6"
                style={{ borderColor: project.color + "33" }}
              >
                <h3 className="font-semibold">{project.title}</h3>
                <p className="mt-1 text-sm" style={{ color: project.color }}>
                  {project.subtitle}
                </p>
                <p className="mt-2 text-sm text-foreground/60 line-clamp-3">
                  {project.body}
                </p>
                {project.links && project.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.links.map((link) => (
                      <Badge key={link.url}>
                        <a href={link.url} target="_blank" rel="noreferrer">
                          {link.text}
                        </a>
                      </Badge>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
