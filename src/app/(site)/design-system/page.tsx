import { ArrowUpRight, Check } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const anchorLinks = [
  { href: "#color", label: "Color" },
  { href: "#type", label: "Typography" },
  { href: "#components", label: "Components" },
  { href: "#content", label: "Learning content" },
  { href: "#tokens", label: "Shape & elevation" },
  { href: "#accessibility", label: "Accessibility" },
] as const;

const palette = [
  {
    name: "Canvas",
    hex: "#060D20",
    token: "--background",
    utility: "bg-background",
    use: "Application background",
  },
  {
    name: "Surface",
    hex: "#1B1B1B",
    token: "--surface",
    utility: "bg-surface",
    use: "Cards and panels",
  },
  {
    name: "Elevated surface",
    hex: "#2C394B",
    token: "--surface-elevated",
    utility: "bg-surface-elevated",
    use: "Nested layers, hover states",
  },
  {
    name: "AI accent",
    hex: "#8E05C2",
    token: "--ai",
    utility: "bg-ai",
    use: "Primary actions and brand surfaces",
  },
  {
    name: "Progress accent",
    hex: "#6A68F6",
    token: "--progress",
    utility: "bg-progress",
    use: "Progress, focus, learning signals",
  },
  {
    name: "Secondary text",
    hex: "#CCDEF6",
    token: "--ink-muted",
    utility: "text-ink-muted",
    use: "Body copy and descriptions",
  },
  {
    name: "Danger",
    hex: "#FFB4B4",
    token: "--danger",
    utility: "text-danger",
    use: "Form errors and destructive notices",
  },
  {
    name: "Primary text",
    hex: "#FFFFFF",
    token: "--foreground",
    utility: "text-foreground",
    use: "Headings and emphasis",
  },
] as const;

const typeScale = [
  {
    name: "Display",
    className: "text-4xl leading-[1.02] font-extrabold tracking-[-0.045em] sm:text-5xl",
    spec: "48 / 800 / -4.5%",
    sample: "Learn from the source",
  },
  {
    name: "Heading 1",
    className: "text-3xl leading-tight font-extrabold tracking-[-0.03em]",
    spec: "36 / 800 / -3%",
    sample: "Source-grounded explanations",
  },
  {
    name: "Heading 2",
    className: "text-2xl leading-snug font-bold tracking-[-0.02em]",
    spec: "24 / 700 / -2%",
    sample: "A clearer path through the material",
  },
  {
    name: "Body",
    className: "text-base leading-relaxed font-normal text-ink-muted",
    spec: "16 / 400 / 1.625",
    sample: "Ask a question and keep the citation attached to the answer.",
  },
  {
    name: "Caption",
    className: "text-xs font-semibold tracking-[0.12em] uppercase text-ink-muted/70",
    spec: "12 / 600 / +12%",
    sample: "Source · p. 214",
  },
] as const;

const contrastPairs = [
  { pair: "White on canvas", ratio: "19.33:1", tier: "AAA", use: "Headings, primary text" },
  { pair: "Soft blue on canvas", ratio: "14.13:1", tier: "AAA", use: "Body copy" },
  { pair: "Danger on surface", ratio: "10.20:1", tier: "AAA", use: "Error messages" },
  { pair: "White on AI purple", ratio: "7.12:1", tier: "AAA", use: "Primary buttons" },
  { pair: "Progress blue on canvas", ratio: "4.53:1", tier: "AA", use: "Labels, indicators" },
  {
    pair: "AI purple on canvas",
    ratio: "2.72:1",
    tier: "Graphics only",
    use: "Never small text",
  },
] as const;

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-balance">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Design system",
  description:
    "The Dawai design tokens, typography, UI primitives, and accessibility notes that keep the product coherent.",
};

export default function DesignSystemPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-20" />
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10" />

        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Badge variant="outline" className="border-progress/40 bg-progress/10">
            <span className="size-1.5 rounded-full bg-progress" aria-hidden="true" />
            Design system · v0.1
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.03] font-extrabold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            Foundations for{" "}
            <span className="font-serif font-medium tracking-[-0.02em] text-ink-muted italic">
              focus.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            A dark-first system built for long study sessions: low-glare surfaces, one accent per
            job, and a reading face that stays out of the way.
          </p>

          <nav aria-label="On this page" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {anchorLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex rounded-full border border-border bg-surface/40 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors duration-200 hover:border-border-strong hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <section id="color" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="color-heading"
            eyebrow="01 · Color"
            title="A small palette with clear jobs."
            description="The AI accent is a surface color, not a text color. The progress accent carries learning signals and focus. Soft blue keeps long-form copy readable without pure-white glare."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {palette.map((color) => (
              <li
                key={color.token}
                className="overflow-hidden rounded-xl border border-border bg-surface/40"
              >
                <div
                  className="h-24 border-b border-border"
                  style={{ backgroundColor: `var(${color.token})` }}
                />
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-bold">{color.name}</h3>
                    <code className="font-mono text-xs text-ink-muted">{color.hex}</code>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">{color.use}</p>
                  <p className="mt-3 font-mono text-[0.6875rem] text-ink-muted/70">
                    {color.token} · {color.utility}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-surface/60 px-4 py-3">
              <h3 className="text-sm font-bold">Contrast pairs</h3>
            </div>
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Color contrast pairs"
              tabIndex={0}
            >
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-[0.625rem] tracking-[0.14em] text-ink-muted/70 uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Pair
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Ratio
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Result
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Use
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {contrastPairs.map((row) => (
                    <tr key={row.pair}>
                      <td className="px-4 py-3 text-ink-muted">{row.pair}</td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{row.ratio}</td>
                      <td className="px-4 py-3">
                        <Badge variant={row.tier === "Graphics only" ? "outline" : "progress"}>
                          {row.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="type" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="type-heading"
            eyebrow="02 · Typography"
            title="Montserrat for the interface. Source Serif for the reading."
            description="Product chrome stays geometric and confident. Learning content switches to a serif at a comfortable measure, because reading is the primary task."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card className="bg-surface/50">
              <CardHeader>
                <p className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                  UI · Montserrat
                </p>
                <CardTitle className="text-2xl">Built for orientation</CardTitle>
                <CardDescription>
                  Navigation, labels, buttons, and short explanations. Weights 400–800.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-extrabold tracking-tight">Turn sources into lessons.</p>
              </CardContent>
            </Card>

            <Card className="bg-surface/50">
              <CardHeader>
                <p className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                  Learning · Source Serif 4
                </p>
                <CardTitle className="font-serif text-2xl">Built for reading</CardTitle>
                <CardDescription>
                  Explanations, transcripts, and lesson bodies. Set at a 68ch measure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-lg leading-relaxed text-ink-muted">
                  A good explanation keeps the source in view while it adds meaning.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 divide-y divide-border rounded-xl border border-border">
            {typeScale.map((type) => (
              <div
                key={type.name}
                className="grid gap-4 p-5 sm:grid-cols-[9rem_1fr] sm:items-baseline"
              >
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                    {type.name}
                  </p>
                  <p className="mt-1 font-mono text-[0.625rem] text-ink-muted/60">{type.spec}</p>
                </div>
                <p className={type.className}>{type.sample}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="components"
        className="scroll-mt-20 border-b border-border bg-surface/20 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="components-heading"
            eyebrow="03 · Components"
            title="Primitives with one visual language."
            description="Buttons, badges, cards, inputs, and progress follow the same token set. New primitives should reuse them rather than introducing one-off colors or radii."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Card className="bg-background/40">
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Primary uses the AI accent. Secondary and outline stay neutral.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button disabled>Disabled</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Icon button sample">
                    <ArrowUpRight aria-hidden="true" />
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-ink-muted/70">
                  Minimum interactive height is 36px for compact controls and 44px for primary touch
                  targets.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardHeader>
                <CardTitle>Badges &amp; progress</CardTitle>
                <CardDescription>
                  Status is always paired with text, never color alone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="solid">Solid</Badge>
                  <Badge variant="progress">Progress</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-ink-muted">Weekly recall · sample</span>
                    <span className="font-bold text-foreground">68%</span>
                  </div>
                  <Progress value={68} label="Sample weekly recall" className="mt-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-ink-muted">Source coverage · sample</span>
                    <span className="font-bold text-foreground">92%</span>
                  </div>
                  <Progress value={92} label="Sample source coverage" className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>
                  Labels are always visible; placeholders are hints only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm space-y-2">
                  <label htmlFor="design-system-email" className="text-sm font-semibold">
                    Email <span className="font-normal text-ink-muted/60">(sample)</span>
                  </label>
                  <Input
                    id="design-system-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <p className="text-xs text-ink-muted/70">
                    Focus the field to see the progress-blue ring.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="progress">Sample card</Badge>
                  <span className="text-[0.625rem] tracking-[0.12em] text-ink-muted/60 uppercase">
                    Component
                  </span>
                </div>
                <CardTitle className="pt-2">Retrieval practice</CardTitle>
                <CardDescription>
                  Cards use the surface token with a single-pixel border. Elevation is reserved for
                  floating panels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-ink-muted">
                  A card is a container, not a decoration. If content does not need grouping, skip
                  it.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-ink-muted/70">Card footer region</span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <section id="content" className="scroll-mt-20 border-b border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="content-heading"
            eyebrow="04 · Learning content"
            title="The reading surface has its own rules."
            description="Lesson bodies use the serif face, generous leading, and a bounded measure. Citations and callouts are first-class elements, not afterthoughts."
          />

          <div className="mt-10 rounded-xl border border-border bg-surface/40 p-6 sm:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Sample learning content</Badge>
              <span className="text-xs text-ink-muted/70">Typography only — not a live lesson</span>
            </div>
            <article className="learning-content">
              <h2 id="atp-synthase">ATP synthase as a molecular turbine</h2>
              <p>
                ATP synthase sits in the inner mitochondrial membrane and converts an
                electrochemical gradient into chemical energy. Protons flow down their gradient
                through the enzyme, and that flow is coupled to rotation.
              </p>
              <blockquote>
                The gradient is the pressure; the rotor is the wheel. Each full turn drives the
                catalytic head through a cycle that builds ATP.
              </blockquote>
              <ul>
                <li>Protons move from high to low concentration.</li>
                <li>Rotation changes the shape of the catalytic sites.</li>
                <li>ADP and phosphate are joined into ATP.</li>
              </ul>
              <div className="learning-callout">
                <strong>Check your understanding.</strong> Why would collapsing the proton gradient
                stop ATP production, even if ADP and phosphate are still available?
              </div>
              <p>
                For a primary source, see{" "}
                <a href="https://openstax.org/" target="_blank" rel="noreferrer">
                  OpenStax Biology
                </a>
                . Every generated explanation should point back to material like this.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="tokens"
        className="scroll-mt-20 border-b border-border bg-surface/20 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="tokens-heading"
            eyebrow="05 · Shape & elevation"
            title="Quiet geometry, purposeful depth."
            description="Radii are derived from one base value. Shadows are reserved for floating panels and accent glows, never for static cards."
          />

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Card className="bg-background/40">
              <CardHeader>
                <CardTitle>Radius scale</CardTitle>
                <CardDescription>Base radius: 12px.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { name: "sm", className: "rounded-sm" },
                    { name: "md", className: "rounded-md" },
                    { name: "lg", className: "rounded-lg" },
                    { name: "xl", className: "rounded-xl" },
                    { name: "2xl", className: "rounded-2xl" },
                  ].map((radius) => (
                    <div key={radius.name} className="space-y-2">
                      <div
                        className={`flex h-16 items-center justify-center border border-border-strong bg-surface-elevated text-xs font-semibold text-ink-muted ${radius.className}`}
                      >
                        {radius.name}
                      </div>
                      <p className="text-center font-mono text-[0.625rem] text-ink-muted/60">
                        rounded-{radius.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/40">
              <CardHeader>
                <CardTitle>Elevation</CardTitle>
                <CardDescription>Two accent glows; one neutral raised shadow.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex h-24 items-end rounded-lg border border-border bg-surface p-3 shadow-raised">
                      <span className="text-[0.625rem] font-semibold text-ink-muted">raised</span>
                    </div>
                    <p className="text-center font-mono text-[0.625rem] text-ink-muted/60">
                      shadow-raised
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-24 items-end rounded-lg border border-border bg-surface p-3 shadow-ai">
                      <span className="text-[0.625rem] font-semibold text-ink-muted">AI glow</span>
                    </div>
                    <p className="text-center font-mono text-[0.625rem] text-ink-muted/60">
                      shadow-ai
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex h-24 items-end rounded-lg border border-border bg-surface p-3 shadow-progress">
                      <span className="text-[0.625rem] font-semibold text-ink-muted">progress</span>
                    </div>
                    <p className="text-center font-mono text-[0.625rem] text-ink-muted/60">
                      shadow-progress
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background/40 p-5">
            <h3 className="text-sm font-bold">Implementation notes</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-muted">
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                <span className="min-w-0">
                  Tokens live in{" "}
                  <code className="font-mono text-xs text-foreground">globals.css</code> and are
                  exposed through Tailwind theme utilities.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                <span className="min-w-0">
                  Components use semantic classes such as{" "}
                  <code className="font-mono text-xs text-foreground">bg-ai</code>; raw hex values
                  stay out of TSX.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                <span className="min-w-0">
                  Use <code className="font-mono text-xs text-foreground">cn()</code> from{" "}
                  <code className="font-mono text-xs text-foreground">src/lib/utils.ts</code> for
                  class overrides.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="accessibility" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            id="accessibility-heading"
            eyebrow="06 · Accessibility"
            title="Accessible by construction."
            description="Foundations are chosen so accessibility is the default: semantic landmarks, a skip link, visible focus, reduced-motion support, and contrast checked before components are built."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card className="bg-surface/50">
              <CardHeader>
                <CardTitle>Built in</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
                  {[
                    "Semantic header, nav, main, and footer landmarks.",
                    "Skip-to-content link on every page using the site layout.",
                    "Progress-blue focus outline with offset on interactive elements.",
                    "Reduced-motion media query disables transitions and scroll smoothing.",
                    "Status always includes text; color is never the only signal.",
                    "Decorative SVG is hidden from assistive technology.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-transparent shadow-none">
              <CardHeader>
                <CardTitle>Next accessibility work</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
                  {[
                    "Add automated axe checks to component and end-to-end tests.",
                    "Run a screen-reader pass on the first real learning flow.",
                    "Validate the reading surface with real long-form content.",
                    "Document keyboard shortcuts once interactive study tools exist.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-muted/50"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
