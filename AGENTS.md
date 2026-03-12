# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

- App stack: React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, Tauri 2.
- Native layer: Rust code lives in `src-tauri/`.
- Server layer: OAuth helper server lives in `server/`.
- Package manager: `pnpm` via `pnpm@10.30.3`.
- Main frontend code lives in `src/`.

## Repository-Specific Workflow

- Pull before work when safe: prefer `git pull --rebase`.
- If pull is blocked by a dirty tree, do not discard or stash user work without approval.
- Commit after each completed change set.
- Before any push, run `pnpm tauri build`.
- Reuse an existing PR when the work already belongs to one.
- For a new feature, create a PR if none exists yet.
- Do not force-push or rewrite history unless explicitly asked.

## Rules Files Check

- No `.cursorrules` file exists.
- No files were found in `.cursor/rules/`.
- No `.github/copilot-instructions.md` file exists.
- If any of those appear later, treat them as higher-priority instructions and update this file.

## Important Paths

- `src/`: React app.
- `src/components/ui/`: base UI primitives.
- `src/components/widgets/`: app-specific UI composition.
- `src/lib/`: shared types, API helpers, persistence, providers, modes.
- `server/`: Express-style OAuth server.
- `src-tauri/src/`: Rust commands and Tauri app bootstrap.

## Install And Run

- Install deps: `pnpm install`
- Frontend dev: `pnpm dev`
- OAuth server dev: `pnpm server:dev`
- Tauri dev shell: `pnpm tauri:dev`
- Vite preview: `pnpm preview`
- Kill default frontend port: `pnpm kill`

## Build Commands

- Frontend build: `pnpm build`
- OAuth server build: `pnpm server:build`
- Start built server: `pnpm server:start`
- Tauri desktop build: `pnpm tauri build`
- Android init: `pnpm tauri:android:init`
- Android dev: `pnpm tauri:android:dev`
- Android build: `pnpm tauri:android:build`

## Lint And Typecheck

- Full lint: `pnpm lint`
- Lint one file: `pnpm exec eslint src/components/MessageInput.tsx`
- Frontend typecheck: `pnpm exec tsc -p tsconfig.json --noEmit`
- Server typecheck: `pnpm exec tsc -p server/tsconfig.json --noEmit`
- Rust verification: `cargo test --manifest-path src-tauri/Cargo.toml`

## Test Commands

- Frontend tests: no JS test runner is currently configured.
- Server tests: no dedicated server test runner is currently configured.
- Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- List Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml -- --list`
- Run one Rust test: `cargo test --manifest-path src-tauri/Cargo.toml test_name`
- Run one exact Rust test: `cargo test --manifest-path src-tauri/Cargo.toml test_name -- --exact`

## Single-Test Notes

- Today the repo has no configured Vitest, Jest, Playwright, or Cypress commands.
- Today the Rust crate reports zero tests when listed.
- If you add test tooling, add exact single-test commands here immediately.

## Recommended Validation By Change Type

- Docs-only change: read the touched docs and confirm commands still exist.
- Frontend change: run `pnpm lint` and `pnpm exec tsc -p tsconfig.json --noEmit`.
- Server change: also run `pnpm exec tsc -p server/tsconfig.json --noEmit`.
- Rust/Tauri change: run `cargo test --manifest-path src-tauri/Cargo.toml`.
- Before push: run `pnpm tauri build`.

## Git Hygiene

- Start with `git status --short --branch`.
- Read diffs in files already modified before editing them.
- Never revert unrelated user changes.
- Keep commits focused; only stage files relevant to your change.
- Avoid `git commit --amend` unless the user explicitly requests it.

## TypeScript And Module Conventions

- Frontend TS uses `moduleResolution: bundler` and `jsx: react-jsx`.
- Frontend TS enables `strictNullChecks`; do not assume values are present.
- Server TS is stricter and uses `strict: true`.
- Use the `@/*` alias for imports inside `src/`.
- Existing code sometimes imports with explicit `.ts` or `.tsx` extensions; preserve local style.

## Import Style

- Prefer import groups in this order: external packages, `@/` imports, then relative imports.
- Use `import type` when it improves readability and avoids runtime confusion.
- Combine duplicate imports from the same module when touching a file.
- Keep side-effect imports near the top, especially app bootstrap and CSS imports.
- Prefer alias imports over deep relative chains inside `src/`.

## Formatting Style

- Match the surrounding file first.
- Most app and server files use 2-space indentation.
- Most app and server files use single quotes and omit semicolons.
- Some config files use double quotes and semicolons; keep those consistent.
- Keep JSX readable rather than aggressively compact.
- Do not introduce a formatter config unless asked.

## Naming Conventions

- Components: PascalCase file names and symbol names.
- Interfaces and type aliases: PascalCase.
- Functions, variables, hooks, props: camelCase.
- Hook names start with `use`.
- Shared constants may use UPPER_SNAKE_CASE.
- String unions should match existing lowercase or kebab-case literals.

## Types And Data Modeling

- Reuse and extend shared shapes in `src/lib/types.ts`.
- Prefer explicit interfaces for persisted or cross-module data.
- Avoid duplicating object shapes inline when a shared type exists.
- Normalize persisted or remote data before trusting it.
- Be careful when changing persisted structures used by local storage or SQLite.

## React Conventions

- Use function components and hooks.
- Keep prop types adjacent to the component.
- Use local helpers or `useMemo` for safe derived state.
- Clean up listeners, intervals, animation frames, and subscriptions in `useEffect` cleanups.
- Keep UI primitives in `src/components/ui/` and app-specific composition in `src/components/widgets/`.

## Styling Conventions

- Use Tailwind utility classes for most styling.
- Prefer existing theme tokens and CSS variables over raw one-off colors.
- Use `cn()` from `src/lib/utils.ts` when class merging is needed.
- Reuse existing shadcn/ui primitives before adding bespoke controls.
- Maintain desktop and mobile behavior.

## Error Handling

- Throw `Error` objects from low-level async helpers when requests fail.
- Catch errors at UI or route boundaries when recovery or user feedback is possible.
- Log failures with context, usually `console.error('message:', error)`.
- In persistence flows, prefer graceful fallback over app-breaking failure.
- In Express handlers, return structured JSON with stable `error` and `message` fields.
- In Rust, preserve context with informative `map_err` messages.

## Networking And Persistence

- Streaming chat API handling lives in `src/lib/api.ts`.
- OAuth client logic lives in `src/lib/oauth.ts`.
- OAuth server routes live in `server/routes/oauth.ts`.
- App config/session persistence lives in `src/lib/persistence.ts`.
- Tauri persistence commands are implemented in `src-tauri/src/lib.rs`.

## Tauri And CI Notes

- macOS CI builds with `pnpm tauri build --target aarch64-apple-darwin`.
- Android CI builds with `pnpm tauri android build`.
- If you change Tauri config, packaging, or native files, keep CI assumptions intact.

## Known State At Time Of Writing

- `pnpm lint` passes with existing Fast Refresh warnings in some `src/components/ui/` files.
- Frontend typecheck succeeds with `pnpm exec tsc -p tsconfig.json --noEmit`.
- Rust test command succeeds but currently finds zero tests.
- Server typecheck currently fails because `express` types are not fully available/configured and one route narrows `unknown` incompletely.

## Keep This File Updated

- Update commands when `package.json`, CI workflows, or test tooling changes.
- Add Cursor/Copilot rule summaries if those files are introduced.
- Keep guidance concrete and repository-specific.
