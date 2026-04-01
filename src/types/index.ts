export interface SocialLink {
  label: string;
  href: string;
  icon?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  href?: string;
  repoHref?: string;
  imageUrl?: string;
  featured?: boolean;
}

export interface Skill {
  name: string;
  category: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
}
