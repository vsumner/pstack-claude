# Pinned Pi and Codex setup

These instructions target the `vsumner/pstack-claude` fork. The historical reviewed installation baseline is **0.9.103**, commit **c6c138bd0e3e010f18ba5fd3c43c94e402d1b164**, checked offline with **Pi 1.4.0** and **Codex CLI 0.163.0**. The 0.9.104 alignment release has its own PR evidence; choose its exact reviewed commit when installing it. Later source or host versions need their own checks. The upstream project and Claude Code installation remain available in the [README](../README.md).

## Inspect and back up first

Run `pi --version`, `pi list`, `codex --version`, `codex plugin marketplace list --json`, and `codex plugin list --json`. Check the actual executable paths and registration sources. Stop if a `pstack-claude` marketplace belongs to a different source, or if existing skill directories contain unrelated changes. Do not overwrite those paths or add duplicate shared wrappers.

Before changing registration, make a private backup and record each path's existence, source and fingerprint:

| Path | What an update may change |
| --- | --- |
| `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/settings.json` | The one pstack package declaration |
| `${CODEX_HOME:-$HOME/.codex}/config.toml` | The pstack marketplace/plugin blocks |
| `${CODEX_HOME:-$HOME/.codex}/plugins/cache/pstack-claude/` | The versioned plugin cache; explicit plugin removal/reinstallation changes it |
| The new snapshot directory | New source only; keep the old snapshot |

Back up only the affected config/cache paths, preserving file modes and symlinks. Record absent paths as absent. Keep auth files, sessions, global AGENTS instructions, project guidance and existing `pstack-models.md` profiles untouched. If the user explicitly chooses a routing-setting change, add that sheet to the backup too and preserve every other row. Check that each backup exists and matches the pre-update fingerprints. Record the post-update fingerprints too, so rollback can refuse later user changes.

## Get an immutable snapshot

Run one command at a time and stop on any error. The destination must be new. If it already exists, verify it instead of deleting or overwriting it.

```sh
pstack_rev=c6c138bd0e3e010f18ba5fd3c43c94e402d1b164
pstack_root="$HOME/.local/share/pstack-claude/$pstack_rev"
git clone --no-checkout https://github.com/vsumner/pstack-claude.git "$pstack_root"
git -C "$pstack_root" checkout --detach "$pstack_rev"
git -C "$pstack_root" rev-parse HEAD
git -C "$pstack_root" status --short
```

Confirm the exact SHA and a clean checkout. For a later release, substitute its reviewed immutable commit and use another directory. Never `git pull` or edit an installed pinned snapshot in place.

## Register a fresh installation

Use the local paths supported by both hosts:

```sh
pi install "$pstack_root"
codex plugin marketplace add "$pstack_root" --json
codex plugin add pstack@pstack-claude --json
```

Pi loads a local package from that path; it does not install its dependencies or copy the package. Pi supplies its own extension API and `typebox` peer packages. Codex installs the plugin into its versioned cache. The repository's `VERSION` and generator stamp the manifests; a release containing changed plugin files needs a new version so an old cache cannot be mistaken for it.

These commands do not select models or reasoning levels. Preserve existing role choices and effort policy. On a fresh setup, use `inherit-parent` and `default effort: session` only when host inheritance is the desired policy; do not guess provider/model IDs. Codex's actual native tool schema and model defaults remain authoritative. A newly selected model without an explicit effort can use that model's native default rather than the old parent's effort.

To keep pstack's routing mandate off, preserve or set `session hook: off` in the existing Pi/Codex `pstack-models.md` sheet. Pi keeps its sheet in its agent directory; Codex keeps it in `CODEX_HOME`. Edit only that setting, preserving other rows. No global AGENTS rewrite or Codex hook trust is needed for explicit skill use.

## Update registration to a new local snapshot

After creating and reviewing a new snapshot and making the backup above, close existing host sessions. Set `pstack_old_root` to the verified old registered source and `pstack_root` to the new one. Confirm this marketplace contains only the pstack plugin before removing it; plan separately if other plugins depend on it.

```sh
pi remove "$pstack_old_root"
pi install "$pstack_root"
codex plugin remove pstack@pstack-claude --json
codex plugin marketplace remove pstack-claude --json
codex plugin marketplace add "$pstack_root" --json
codex plugin add pstack@pstack-claude --json
```

Codex 0.163 leaves the installed plugin cache behind when only its marketplace is removed. Explicitly remove the plugin first, especially when source files changed without a version change; otherwise reinstalling can reuse stale bytes. Verify the resulting cached file tree against the exact new source, excluding documented host metadata. This remove/reinstall sequence was verified for same-version snapshots in disposable homes; it grants no hook trust.

Codex 0.163 rejects adding an existing marketplace name from a different local source. The supported remove/add sequence was checked in disposable homes. `codex plugin marketplace upgrade` refreshes Git-backed marketplace snapshots; it does not replace this local-path sequence. Pi's bare `pi update` updates the **host**. `pi update --extensions` updates packages, and configured Git refs stay pinned. None of those commands switches this local snapshot to a new commit automatically.

After every successful command, record the resulting changed paths. On failure, inspect the actual registration/cache before retrying. An interrupted command can leave state newer than the last manifest entry; reconcile it rather than treating an uncertain write as absent.

## Verify and invoke

Start fresh host sessions after checking registration and the exact source/version again. Confirm a single pstack package/plugin, no old shared-wrapper duplicates, preserved model/effort profiles and routing setting, and unchanged protected instructions/auth/session metadata.

| Host | Explicit entry point | Discovery check |
| --- | --- | --- |
| Pi | `/skill:poteto-help`, then `/skill:poteto-mode` for a task | Native command discovery lists the skills, `/loop` and `/pstack-agents` |
| Codex | Type `$` and choose `pstack:poteto-help` or `pstack:poteto-mode` | Native `skills/list` identifies the plugin's names and paths; `hooks/list` reports trust separately |

Pi registers `agent`, `send_message`, `list_agents`, `stop_agent`, `ask_user_question` and `schedule_wakeup`. Registration is not proof of live lifecycle behavior. Codex already owns its native subagent lifecycle: use the tools the current host exposes. Its 0.163 default enables multi-agent support; do not edit global config merely because an older guide says to enable it.

New Pi/Codex project skills use `.agents/skills/<name>/SKILL.md`. Existing supported paths and names are preserved. Both hosts scan ancestors from cwd to the repository root, not every nested package. Launch inside a nested package to discover its local skill; an authorized read by exact path does not register it. Pi also supports `.pi/skills` and gates project skills on project trust. A missing skill can therefore be a cwd or trust issue. Diagnose it without automatically changing trust, moving skills or editing discovery settings.

## Routing, trust and evidence boundaries

`session hook: off` disables pstack's mandate, **not host implicit skill selection**. Pi still advertises available skills; its model sheet and adapter note also remain. Codex's current [skills docs](https://learn.chatgpt.com/docs/build-skills) describe a metadata context budget and a separate explicit-only invocation policy. `skills/list` proves discovery, not that every skill is in model context or that a model invoked it correctly. Do not silently change invocation preferences.

Codex plugin installation does not trust hooks. Keep the routing hook untrusted unless the user separately chooses to enable and trust it. The compatibility variable `CLAUDE_PLUGIN_ROOT` is intentional. See [official plugin documentation](https://developers.openai.com/plugins/build/plugins) and [hooks](https://learn.chatgpt.com/docs/hooks). Current docs may describe newer manifests/features than installed 0.163; use the installed help/exported schemas before relying on them. App-server and schema-generation tooling are labelled experimental even when a method is in its default export.

Pi project trust controls resource loading, not filesystem/network permissions. AGENTS/CLAUDE context can still load when project resources are skipped. Parent transient trust flags and other CLI restrictions are not automatically copied into a pstack child. Read-only agent tools retain shell access, and worktrees isolate Git state rather than security authority. See [Pi 1.4 security documentation](https://github.com/earendil-works/pi/blob/v1.4.0/packages/coding-agent/docs/security.md).

The baseline checks covered offline contracts, native metadata discovery and routing-off behavior. No live provider/account validation, native Codex subagent turn, or process-identity/orphan checks were run under the restricted process policy. Historical upstream live results in [Pi equivalence](pi-equivalence.md) are separate evidence, not current proof for this fork. Use [restricted-safe tests](../CONTRIBUTING.md#restricted-environment-checks) for repeatable offline coverage.

## Optional helper prerequisites

See the package-local [helper prerequisites](../plugins/pstack/skills/poteto-mode/references/helper-prerequisites.md) for Bun/Node entrypoints, lazy locked bootstrap, writable-directory requirements and data/access scope. Ordinary explicit skills and native host discovery do not require these optional helpers. Approved operational use follows the [pinned writable helper checkout](../plugins/pstack/skills/poteto-mode/references/operational-helpers.md), with durable program state separate from it. Approved local adaptations use [dependency-preserving skill copies](../plugins/pstack/skills/poteto-mode/references/local-skill-overrides.md) and explicit distinct names.

## Roll back without overwriting later work

Close host sessions. Before any restore/removal, verify **all** required backups against their recorded pre-update fingerprints and verify current affected paths against their post-update fingerprints. Missing/corrupt backups or later user changes must stop the whole rollback before it mutates anything; merge manually instead. Restore original config/cache paths, preserve their modes/symlinks, and remove only unchanged paths recorded as newly created. Preserve old snapshots and the backup itself. Do not restore auth/session files or overwrite profiles/instructions.

For a verified single-plugin marketplace, native registration can instead be switched back using the update sequence with the old snapshot as the destination. This reconstructs its cache; it is not a byte-for-byte restoration of configuration backups. Inspect unrelated settings and plugin state afterward. Start fresh sessions and verify the old pin, unique discovery and unchanged routing/trust/model choices. Do not delete a feature branch, change security settings or call a provider to test rollback.
