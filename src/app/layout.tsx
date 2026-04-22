import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Web3Provider } from "@/providers/Web3Provider";
import { AuthProvider } from "@/providers/AuthProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eulonomys — Permanent On-Chain Eulogies",
  description:
    "Create permanent, immutable eulogies stored on the Autonomys Network. Preserve memories forever.",
};

function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Eulonomys
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/browse" className="hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/sponsors" className="hover:text-foreground transition-colors">
            Sponsors
          </Link>
          <Link
            href="/create"
            className="rounded-md bg-stone-800 px-4 py-2 text-sm text-stone-50 hover:bg-stone-700 transition-colors"
          >
            Create Eulogy
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-muted">
        <p>
          Eulogies are stored permanently on the{" "}
          <a
            href="https://autonomys.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Autonomys Network
          </a>
          . They cannot be altered, deleted, or censored.
        </p>
        <div className="mt-4 flex justify-center gap-6">
          <Link href="/guidelines" className="hover:text-foreground transition-colors">
            Community Guidelines
          </Link>
          <a
            href="https://autonomys.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            About Autonomys
          </a>
          <a
            href="https://github.com/autonomys-community/eulonomys"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Web3Provider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
