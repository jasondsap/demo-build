import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SURVEY } from "@/lib/survey";

export const metadata: Metadata = {
  title: SURVEY.title,
  description: "A one-minute anonymous community survey with an AI summary. Built live at APHA 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-navy text-white">
          <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-lg">
              {SURVEY.title}
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">Survey</Link>
              <Link href="/results" className="hover:underline">Results</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl px-4 py-8 flex-1">{children}</main>
        <footer className="text-center text-xs text-muted py-6">
          Anonymous. Aggregate results only. Built with Next.js, Neon and Claude.
        </footer>
      </body>
    </html>
  );
}
