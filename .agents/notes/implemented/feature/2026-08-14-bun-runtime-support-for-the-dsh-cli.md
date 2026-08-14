# Agent Note: bun runtime support for the published dsh CLI

Status: implemented

English | [中文](2026-08-14-bun-runtime-support-for-the-dsh-cli.zh.md)

## Problem

`bunx @lanshi17/dsh web` is the natural no-install launch path for the published CLI on machines that standardize on bun, and it failed: booting the web profile under bun threw `Export named 'stripTypeScriptTypes' not found in module 'node:module'` (the code-runtime entry's static import), then, once that was fixed, `Cannot find module '@lanshi17/dsh-client-ui-directory-picker-browse' from '…/loader/src/config/tree.ts'` (bare plugin specifiers resolving from the loader's own location instead of the config directory) and `--expose-internals is required for HMR service` (the watch-only config-reload mount demanded the Node internal module loader). The repo also documents `declare` as an accepted identifier in TypeScript sources; bun's TS parser rejects it, breaking source-tree runs under bun (tsconfig `paths` route imports to `src/`).

## Decision

The published dsh family now runs under the bun runtime. `bunx --bun @lanshi17/dsh web` (the bun runtime — plain `bunx` executes the bin with the system Node by default, which already works) boots the web profile and serves the browser UI; `--version` and app `--help` work; the packed-install flow was verified end to end with the bun runtime (see Testing).

**Bare plugin resolution without the internal loader.** Node's internal `ModuleLoader` scopes bare imports to `ctx.baseUrl` (the config/profile directory, plus the healed `profiles/node_modules` fallback); bun's `node:module` polyfill exposes no internal loader, so the loader's fallback branch now resolves bare names from `ctx.baseUrl` with `createRequire(baseUrl).resolve(name)` before importing the file URL ([vendored `tree.ts` change](../../../../vendor/README.md), modification #19). The `node:module` / `node:url` imports are lazy (`await import()` inside the fallback branch), because the loader entry doubles as the browser client entry: a top-level node builtin import breaks the web app's vite build, which browserizes the loader (`node:module` aliased to a throwing stub in `apps/web/vite.config.ts`); the browser never executes the bare-name branch. The app-boot closed-runtime override (`HostResolvedRootInclude`, used when an embedder passes `bareModuleBaseUrl`) resolves bare names from that host base the same way instead of delegating to the loader-location fallback.

**HMR watch-only mode without the internal loader.** The internal-loader requirement is scoped to configured module roots: `root: []` (the dsh CLI's watch-only live user-patch reload) no longer throws, and the init externals collection is skipped without the loader ([vendored `hmr` change](../../../../vendor/README.md), modification #20). Module watching paths are unchanged and remain guarded by the root-implies-internal invariant.

**Type-strip fallback for code-runtime.** `dsh-code-runtime-worker-thread` resolves its stripper once: `node:module`'s `stripTypeScriptTypes` where exported (Node), else amaro's WASM `strip-only` transform (bun), added as a dependency. Both share the seam's contract — erasable syntax only, position-preserving output, `enum`/namespace rejected as a program failure — and amaro's plain-diagnostic throws are normalized to `Error`. The strip resolution is an injectable seam (`resolveStripper`) with unit tests; Node never loads amaro.

**computeMs and pipe capture under bun.** bun's `worker_threads` exposes no event-loop utilization (its stub reports all-zero metrics), so the busy-time poll is skipped under bun — the wall-clock ceiling and output caps remain the budgets — and the service logs one warning at mount. bun also offers no Worker capture streams (`stdout`/`stderr` options yield null), so the host-side native-write backstop registers only when streams exist; the worker-side bootstrap patch still captures JS-level writes, and uncaptured native writes reach the host's own stdio.

**`declare` identifier rename.** The web tree's `llm-pi-ai` local `declare` function (a valid identifier in TypeScript) is renamed `declareProvider`; bun's parser treats `declare` as reserved, which made every source-tree boot under bun fail at parse.

## Alternatives considered

**Skipping the watch-only HMR mount under bun.** Appears cheaper but silently loses the documented hot-reload contract for `cordis.patch.yml` edits on bun; the vendored relaxation keeps the contract with a two-line guard.

**A full TypeScript transpiler (sucrase, `Bun.Transpiler`) for code-runtime.** Would accept `enum`/namespaces by compiling them, silently changing the documented "erasable syntax only, non-erasable syntax is a program failure" contract; amaro's `strip-only` is the same stripper the Node builtin wraps and preserves semantics exactly.

**Leaving the bare-import fallback as `import(name)` from the loader's location.** Works only where the host install hoists every plugin beside the loader (flat npm/bun layouts); under pnpm's isolated layout — and against the documented "bare names resolve from the config directory" contract — it fails. Resolving from `baseUrl` matches the internal loader's behavior for every embedder.

**A bun-specific CLI entry script.** No product change was needed once the loader and code-runtime were runtime-agnostic; a second entry would split the bin surface for one mode.

## Consequences

- `bunx --bun @lanshi17/dsh web` and `bunx dsh web` (global bun install; bunx itself defaults to the system Node, which also works) run under the bun runtime; Node behavior is unchanged (builtin stripper, real computeMs poll, pipe capture backstop all take their previous paths).
- Two vendored packages gained logged local modifications (#19 loader, #20 hmr); the sync procedure must re-apply them.
- `dsh-code-runtime-worker-thread` gains an `amaro` dependency (WASM stripper, loaded only on runtimes without the builtin).
- Under bun: `computeMs` is unenforced (wall ceiling backstops), and native-level worker writes that bypass the patched stream slots are not captured into run logs.
- The repo's own source tree also runs under bun (tsconfig-paths dev flow) now that `llm-pi-ai` parses.

## Testing

- `resolveStripper` unit tests: builtin preferred, amaro strip-only fallback, diagnostic normalization, no-stripper rejection.
- Bundled `code-runtime` exercised under the bun runtime: erasable program with bindings/logs, `enum` rejection with the canonical message, wall-clock ceiling enforcement.
- `dsh web` booted under the bun runtime from the repo (bundled bins) and from a fresh `bun install` of the packed dsh and vendor release families (221 + 9 tarballs): HTTP 200, app HTML and assets served, `--version`/`--help` correct. The bin was executed directly with `bun` (bunx defaults to the system Node, so the direct run is the bun-runtime proof).
- Pre-publish bun installs need `overrides` pinning each family tarball: bun resolves transitive `devDependencies` of installed packages from the registry and does not satisfy transitive ranges from direct `file:` deps; the published registry state resolves without them. node-pty's `node-gyp` build needs `node-gyp` on PATH (npm bundles it, bun does not).
