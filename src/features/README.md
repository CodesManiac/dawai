# Features

Feature-first vertical slices. A feature owns one user capability end to end and
exposes a deliberately small public API.

```
src/features/<feature>/
├── components/   # UI scoped to this feature (server by default)
├── server/       # server actions, use cases, orchestration
├── schemas/      # input/output validation (add zod when first needed)
├── types.ts      # domain types owned by the feature
└── index.ts      # public exports only
```

## Rules

- Routes in `src/app` compose features; they do not contain business logic.
- Import another feature through its `index.ts`, never by reaching into its
  internals.
- Share a component through `src/components/ui` only when at least two features
  need it with the same semantics.
- Keep server-only code out of client bundles. Mark the boundary at the file
  level and pass serializable data to client components.
- A feature is not "done" without tests for its business rules and an
  end-to-end path for its primary flow.

No feature slices exist yet by design. Task 001 stops at the shared foundation.
The first approved feature should establish the concrete example for later work.
