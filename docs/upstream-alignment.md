# Bounded Cursor alignment, 0.9.104

Base: fork `c6c138bd0e3e010f18ba5fd3c43c94e402d1b164`. Previous pstack component pin: `7b353f78f6ec193bdbe48ed8059444eb09b6878e`. Reviewed target: [Cursor plugins `519d36aa98955bf680db01bcde5fdfba686dc901`](https://github.com/cursor/plugins/tree/519d36aa98955bf680db01bcde5fdfba686dc901/pstack), pstack 0.15.34. Cursor main still matched that target when fetched for this update. Other component pins are unchanged.

This is a partial alignment using the existing three-way sync, substitutions, declared forks and generator. It preserves Lauren Tan's upstream authorship, the existing licenses and the port's Pi/Codex/Claude support. It does not claim full latest parity. The two new optional skill trees, `statechart/` and `ketchup-video/`, are excluded in `tools/upstream.json`; no new verifier, renderer or video dependencies are imported.

## Every changed existing upstream file

Paths below are relative to upstream `pstack/`. Each row was compared individually with the fork, including excluded documentation and manifests.

| Upstream file | Decision and reason |
| --- | --- |
| `.cursor-plugin/plugin.json` | Excluded Cursor manifest. Fork manifests are versioned by the existing generator. |
| `README.md` | Keep fork README; retain its multi-host installation. Reflect the sharpen contract in fork reference docs. Cursor/Claude auto-update advice does not replace immutable fork pins. |
| `docs/guide/02-poteto-mode.md` | Excluded upstream guide; adopt sharpen's prompt-only behavior in the actual skill and fork reference. |
| `docs/guide/06-verify-and-ship.md` | Excluded guide. Defer its statechart link; retain the fork's scoped verification labels and artifact binding. |
| `docs/guide/10-recipes-and-pitfalls.md` | Excluded guide; adopt sharpen recipe clarification, defer video cross-link. |
| `plugin.json` | Keep intentional legacy host manifests. Do not introduce a competing portable root manifest on Codex 0.163. |
| `skills/create-formal-verification-skill/SKILL.md` | Defer only the new mandatory statechart instruction because that optional skill is absent. Retain host placement, scope and checker/artifact identity guidance. |
| `skills/poteto-help/SKILL.md` | Adopt sharpen description; omit links to absent statechart/video skills. |
| `skills/poteto-help/references/recipes.md` | Adopt prompt-before-send recipe. |
| `skills/poteto-mode/scripts/check-plan.mjs` | Adopt matching multi-backtick code-span parsing, preserving the fork's fenced-code handling. |
| `skills/poteto-mode/scripts/check-plan.test.ts` | Adopt regression cases for code spans and prose outside them. |
| `skills/poteto-mode/scripts/orch/orch.test.ts` | Adopt replacement historical PR and multiple-active-PR regressions using existing forge fixtures. |
| `skills/poteto-mode/scripts/orch/store.ts` | Adapt sole-active-PR preference after the fork's head-repository filter; historical anchors remain when no local PR is open. |
| `skills/poteto-mode/scripts/watch-pr/github.test.ts` | Preserve existing repository-identity, fork/default-branch, duplicate-head and cycle cases instead of adding weaker duplicate fixtures. |
| `skills/poteto-mode/scripts/watch-pr/github.ts` | Existing head repository identity already covers the upstream cross-repository boolean fix, with cycle and ambiguity rejection. Keep it. |
| `skills/poteto-mode/scripts/watch-pr/policy.test.ts` | Preserve existing shared-deadline and retry coverage; add a disabled-deadline control. |
| `skills/poteto-mode/scripts/watch-pr/policy.ts` | Existing monotonic deadline already caps discovery, query, retry and normal polling. Keep it rather than introduce a second deadline. |
| `skills/poteto-mode/scripts/watch-pr/types.ts` | Preserve headRepository and deadline failure types, which the stronger existing implementation needs. |
| `skills/poteto-mode/scripts/worktree-audit.sh` | Still excluded. Fork's Node `worktree-audit.mjs` uses native stat timestamps and date formatting, avoiding BSD/GNU flag differences; preserve its ignored/untracked/reflog and transcript handling. |
| `skills/reflect/SKILL.md` | Adapt no-cache editing and destination-before-approval to host project/personal roots; include pinned snapshots and duplicate-discovery care. No automatic registration, PR or push. |
| `skills/sharpen/SKILL.md` | Adopt explicit prompt rewrite; it returns the prompt without doing the task. |
| `skills/swarm/SKILL.md` | Adopt corrected numbering and result-table wording; preserve local dispatch/worktree and host model/effort policies. |

## Native responsibilities and validation limits

Host discovery, model settings, permissions, trust and Codex worker lifecycle remain host-owned. The Pi extension continues to compose RPC child processes, steering, settlement, cancellation and guarded worktree retention because Pi 1.4 core does not provide this orchestration policy. This update does not replace those safeguards or add another loader, process manager, updater or orchestration kernel.

Use `bun tools/test-suites.mjs safe` for the explicit restricted-safe suite. Helper tests are a separate package under `plugins/pstack/skills/poteto-mode/scripts/`; inspect them and bootstrap locked dependencies only in an authorized disposable writable copy. Native Pi/Codex discovery checks validate registration and metadata, not live model compliance. PR/forge tests use local fakes, not real shipping. Process-identity/orphan lifecycle checks requiring restricted inspection remain unrun. No live provider turn, security/trust change, global installation or optional statechart/video execution is part of this alignment.
