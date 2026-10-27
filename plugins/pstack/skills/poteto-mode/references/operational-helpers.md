# Pinned operational helpers

Use this only for an approved workflow needing optional Bun helpers. Ordinary explicit skills do not need a helper checkout. Installed snapshots and host caches remain immutable. The writable helper checkout is not another skill/plugin installation and stays outside discovery roots.

Reuse Git, the existing locked bootstrap and `--store`/`ORCH_STORE`. No updater or background service is needed. Resolve the full source commit from the installation record, not the version alone. Check [helper prerequisites](helper-prerequisites.md). Registry downloads and real forge actions still require the user's applicable authority.

## Prepare or resume

Set `PIN` to the exact approved 40-character commit and `ORCH_STORE` to the absolute path of the approved durable program directory, outside the helper checkout and disposable evaluation homes. Preserve an existing store. The existing `~/.claude/orchestrate/<project-slug>/` convention is pstack-owned plain state, not Claude discovery. Record the pin, helper path and store in standing orders so a new session uses the same identity.

The operational checkout lives under `${XDG_DATA_HOME:-$HOME/.local/share}/pstack-helpers/<full-pin>/` and preserves the entire repository layout. `PSTACK_REPOSITORY` defaults to this fork; a local fixture may replace it for isolated tests. Never register this checkout with a host.

```sh
# pstack-helper-prepare
set -eu
: "${PIN:?Set the approved full source commit}"
: "${ORCH_STORE:?Set the approved durable program directory}"
case "$ORCH_STORE" in /*) ;; *) echo 'ORCH_STORE must be absolute for stable resumption' >&2; exit 1;; esac
case "$PIN" in *[!0-9a-f]*|'') echo 'PIN must be a full lowercase commit SHA' >&2; exit 1;; esac
test "${#PIN}" -eq 40 || { echo 'PIN must be a full commit SHA' >&2; exit 1; }
PSTACK_REPOSITORY="${PSTACK_REPOSITORY:-https://github.com/vsumner/pstack-claude.git}"
HELPER_CHECKOUT="${XDG_DATA_HOME:-$HOME/.local/share}/pstack-helpers/$PIN"
test ! -L "$HELPER_CHECKOUT" || { echo 'Refusing a symlinked helper checkout' >&2; exit 1; }
if test ! -e "$HELPER_CHECKOUT"; then
  mkdir -p "$(dirname "$HELPER_CHECKOUT")"
  git clone --no-hardlinks --no-checkout "$PSTACK_REPOSITORY" "$HELPER_CHECKOUT"
  git -C "$HELPER_CHECKOUT" checkout --detach "$PIN"
fi
test "$(git -C "$HELPER_CHECKOUT" rev-parse HEAD)" = "$PIN" || { echo 'Helper pin mismatch; preserve the checkout and stop' >&2; exit 1; }
SOURCE_STATUS=$(git -C "$HELPER_CHECKOUT" status --porcelain --untracked-files=all) || { echo 'Cannot verify helper source; preserve the checkout and stop' >&2; exit 1; }
test -z "$SOURCE_STATUS" || { echo 'Helper source changed; preserve the checkout and stop' >&2; exit 1; }
HELPER_SCRIPTS="$HELPER_CHECKOUT/plugins/pstack/skills/poteto-mode/scripts"
test -f "$HELPER_SCRIPTS/bun.lock"
export ORCH_STORE
```

In the same shell, invoke the existing frozen production bootstrap in that writable checkout. Dependencies remain at `HELPER_SCRIPTS/node_modules`; the package and lock hash select the existing install key. No credentials or sessions are copied. Run from the program's repository when an operation uses Git context.

```sh
# pstack-helper-initialize
bun "$HELPER_SCRIPTS/orch/orch.ts" init
bun "$HELPER_SCRIPTS/orch/orch.ts" status --json
```

Subsequent shells rerun **Prepare or resume** with the same pin and store and invoke that exact `orch.ts`. Use this checkout's `watch-pr/watch-pr` and `watch-pr/ship-pr` where needed. Do not invoke bootstrapping entrypoints under the installed plugin, mix helper revisions within a running program, or move its store during an update. Shipping needs separate action authority.

For disposable evaluation, use a temporary HOME/cache and synthetic store/forge. That is a test environment, not the operational store. A fake-forge round trip proves bounded bookkeeping and resumption, not real shipping, credentials, provider behavior or worker liveness.
