import { Code2, Database, Layers, PanelsTopLeft } from "lucide-react";

const layers = [
  {
    label: "Routes",
    path: "src/app",
    description: "Layouts, pages, and route handlers. Thin by design.",
    icon: PanelsTopLeft,
  },
  {
    label: "Features",
    path: "src/features",
    description: "Vertical slices: capability UI, schemas, and use cases.",
    icon: Layers,
  },
  {
    label: "Server",
    path: "src/server",
    description: "AI, document processing, and database contracts.",
    icon: Database,
  },
  {
    label: "Shared",
    path: "src/components · src/lib",
    description: "Design primitives, layout, and pure utilities.",
    icon: Code2,
  },
] as const;

function ArchitectureMap() {
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {layers.map(({ label, path, description, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-surface/60 p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <Icon className="size-4 text-progress" aria-hidden="true" />
              <span className="text-[0.6875rem] font-bold tracking-[0.14em] uppercase">
                {label}
              </span>
            </div>
            <code className="mt-3 block font-mono text-xs text-foreground">{path}</code>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border-strong p-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          <span className="font-semibold text-foreground">Dependency rule:</span> routes → features
          → server. Shared UI and utilities never import server modules. ESLint enforces the
          boundary today; no convention is left to memory.
        </p>
      </div>
    </div>
  );
}

export { ArchitectureMap };
