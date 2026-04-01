import type { NavItem, SocialLink } from "@/types";

export const siteConfig = {
  name: "Jacob",
  title: "Full-Stack Developer",
  description: "I build thoughtful web experiences.",
  url: "https://example.com",
};

export const navItems: NavItem[] = [
  { label: "Profile",     href: "/profile" },
  { label: "Project",     href: "/projects" },
  { label: "Discography", href: "/discography" },
  { label: "Contact",     href: "/contact" },
];

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];
