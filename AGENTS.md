# Quzzar System Designer

<!-- quzzar-skills:start -->

## Agent skills

**Before starting any work in this repo, read the `quzzar-workplace` skill.** It holds the
conventions for issues, branches, commits, PRs, and review, plus the code rules that apply
at every layer: naming, file organization, comments, types, error handling, dependencies.

Then, before writing code, read the skill for the layer you're touching:

- **`quzzar-frontend`**: UI, components, styling, client state, data fetching, forms,
  accessibility, frontend tests.
- **`quzzar-backend`**: API routes, server code, database queries, migrations, validation,
  auth, background jobs, backend tests.

Read the layer skill _before_ writing, not as a check afterwards. A change spanning both
layers needs both.

For visual work, also read **`quzzar-design`** and the installed **`impeccable`** skill.
Follow their reference research, design, critique, refinement, and detector workflow.
Never report a visual change as done without having looked at it rendered.

### Stack

- Languages / toolchains: strict TypeScript; Bun.
- Package manager: Bun (`bun.lock`).
- Frontend: React, Vite, React Flow, vanilla-extract, Radix, Lucide.
- Test: `bun test src/lib`; `bun run test:e2e` (Playwright).
- Typecheck: `bun run typecheck`.
- Lint: `bun run lint`.

<!-- quzzar-skills:end -->

## Product boundaries

This is an npm package with a read-only DOM viewer. Users author graphs through the API; the viewer inspects them. Processing descriptions are text, not executable functions. The companion skill is a future project.

Read `docs/contract-inference.md` before changing schemas, validation, or connection semantics. Read `PRODUCT.md` and `DESIGN.md` before changing the viewer. `src/main.ts` is the example consumer; `src/index.ts` is the package entry point.
