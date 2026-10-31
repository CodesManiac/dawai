import Link from "next/link";

import { DawaiLogo } from "@/components/brand/dawai-logo";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/config/site";

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <DawaiLogo />

        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground sm:px-3"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Badge variant="outline" className="hidden md:inline-flex">
            Foundation 001
          </Badge>
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
