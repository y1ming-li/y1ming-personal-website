import Image from "next/image";
import Link from "next/link";

const links = [
  { label: "Profile",      href: "/profile" },
  { label: "Project",      href: "/projects" },
  { label: "Discography",  href: "/discography" },
  { label: "Contact",      href: "/contact" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 bg-accent">
      <Image
        src="/logo_white.png"
        alt="Logo"
        width={360}
        height={360}
        priority
      />
      <nav className="flex flex-col items-center gap-6">
        {links.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="text-2xl font-bold text-black"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
