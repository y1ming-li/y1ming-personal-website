import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-foreground/60">Page not found.</p>
      <Link
        href="/"
        className="text-sm font-medium underline underline-offset-4 hover:text-foreground/70"
      >
        Go home
      </Link>
    </div>
  );
}
