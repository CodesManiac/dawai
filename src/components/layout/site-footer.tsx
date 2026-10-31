import Link from "next/link";

import { DawaiLogo } from "@/components/brand/dawai-logo";
import { siteConfig } from "@/lib/config/site";

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div className="space-y-3">
          <DawaiLogo />
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{siteConfig.tagline}</p>
        </div>

        <div className="flex flex-col gap-3 md:items-end md:text-right">
          <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-ink-muted/70 uppercase">
            Foundation · Task 001
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-ink-muted/80">
            Product features are intentionally deferred. Architecture rules and the roadmap are
            documented in the repository.
          </p>
          <nav aria-label="Footer" className="flex items-center gap-4">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
