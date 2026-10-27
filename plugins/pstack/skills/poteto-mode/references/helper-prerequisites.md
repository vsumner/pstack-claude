# Optional helper prerequisites

Ordinary explicit skills and native host discovery do not require these helpers. Optional program workflows use the existing scripts under `plugins/pstack/skills/poteto-mode/scripts/`:

| Entrypoint | Prerequisites and effects |
| --- | --- |
| `orch/orch.ts`, `watch-pr/watch-pr`, `watch-pr/ship-pr` | Bun on PATH. Each calls `bootstrap.ts` before CLI parsing, including `--help`. It installs `commander` 14.0.0 with `bun install --frozen-lockfile --production` into the adjacent `scripts/node_modules`, then records a lock/package hash. This needs registry access and a writable scripts directory on first use or lock changes. |
| PR and frontier operations | Git plus an authenticated `gh` CLI for GitHub; some frontier operations support an already configured `origin` CLI instead. Having the executable does not prove account/repository access. Shipping commands perform writes and require the user's existing authority. |
| `check-plan.mjs`, `check-playbooks.mjs`, `worktree-audit.mjs`, `resume.mjs` | Node.js, plus Git where used. They do not need the Bun bootstrap. Audit/resume helpers can read session history; inspect and limit their data scope before running. The worktree audit imports `reflect/scripts/find-transcript.mjs`, so keep the package layout. |

Missing `node_modules` before first use is expected lazy setup, not evidence the helper is broken. Do not bootstrap inside a host-managed plugin cache or edit an installed immutable snapshot. For approved helper evaluation, copy the complete package into a disposable writable directory, preserve the lockfile and relative paths, and use a temporary HOME/cache without auth or sessions. Invoke an entrypoint there to exercise its existing bootstrap; do not add a second installer. Helper tests run from the scripts directory and are separate from the root restricted-safe suite. Inspect tests and commands before selecting them; neither mocked forge commands nor offline tests demonstrate real PR shipping or provider behavior.
