import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div id="site-header">
        <Header />
      </div>
      <main className="flex flex-col flex-1 min-h-0 mx-auto w-full max-w-5xl">{children}</main>
      <Footer />
    </>
  );
}
