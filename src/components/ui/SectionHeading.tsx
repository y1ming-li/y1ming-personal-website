import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-10 space-y-2", className)}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-foreground/60">{subtitle}</p>
      )}
    </div>
  );
}
