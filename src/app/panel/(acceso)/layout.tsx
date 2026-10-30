import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";

// Las pantallas del panel no deben aparecer en buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LayoutAcceso({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <Link href="/" className="rounded-lg text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Logo conLugar />
      </Link>
      <div className="mt-8 w-full max-w-md">{children}</div>
    </main>
  );
}
