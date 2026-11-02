import Link from "next/link";
import type { ReactNode } from "react";

import { DawaiLogo } from "@/components/brand/dawai-logo";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
      />

      <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <DawaiLogo />
        <Link
          href="/"
          className="rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-foreground"
        >
          Back to home
        </Link>
      </header>

      <main
        id="main-content"
        className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        {children}
      </main>

      <footer className="relative border-t border-border px-4 py-5">
        <p className="mx-auto max-w-6xl text-center text-[0.6875rem] leading-relaxed text-ink-muted/60">
          Dawai accounts run on Supabase Auth. Passwords are hashed by Supabase and never stored by
          Dawai.
        </p>
      </footer>
    </div>
  );
}
