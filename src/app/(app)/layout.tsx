import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { DawaiLogo } from "@/components/brand/dawai-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/server/actions";
import { requireUser } from "@/features/auth/server/session";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <DawaiLogo href="/dashboard" />
            <Badge variant="outline" className="hidden sm:inline-flex">
              Task 002
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[16rem] truncate text-xs text-ink-muted md:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border px-4 py-5">
        <p className="mx-auto max-w-6xl text-center text-[0.6875rem] leading-relaxed text-ink-muted/60">
          Dawai · Task 002 authentication foundation. Learning features are not built yet.
        </p>
      </footer>
    </div>
  );
}
