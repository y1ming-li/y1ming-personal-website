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
      <main className="flex flex-col flex-1">{children}</main>
      <Footer />
    </>
  );
}
