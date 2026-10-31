import Link from "next/link";

import { DawaiMark } from "@/components/brand/dawai-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center"
    >
      <DawaiMark className="size-12 rounded-2xl" />
      <p className="mt-8 text-xs font-bold tracking-[0.18em] text-ink-muted uppercase">
        404 · Not found
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        This page has no source.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
        The address may be incorrect, or the page has not been built yet.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return to overview</Link>
      </Button>
    </main>
  );
}
