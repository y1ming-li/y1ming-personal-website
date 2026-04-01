import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { skills } from "@/data/skills";

export function Skills() {
  return (
    <section id="skills" className="py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title="Skills" />
        {skills.length === 0 ? (
          <p className="text-foreground/50">Skills coming soon.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.name}>{skill.name}</Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
