# Cursor alignment, 0.9.106

Base: fork `189af4984c26d1634d515db13aab40c4e23a7ac4` (0.9.105). Previous pstack pin: `519d36aa98955bf680db01bcde5fdfba686dc901` (0.15.34). Latest pstack source: [Cursor `c742dd61706fbacc1b95f1a20b7b988cf096ce6c`](https://github.com/cursor/plugins/tree/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack), version 0.15.36. A fresh fetch on 2026-10-28 returned monorepo main `0f77cd5dab1e006de02d6ad221d5620de026473a`; its pstack tree matches the pinned commit. Only `ab1f702ce8e8b6557edb56b09f52cde8bfb83f17` and `c742dd6` touch pstack in this range. Other component pins are unchanged.

The latest matching feedback is [kb-personal #58, updated October 28](https://github.com/vsumner/kb-personal/issues/58), with no comments. Searches for pstack and fork found no newer matching issue. The two installation defects are resolved in 0.9.105; this update preserves those implementations. The outstanding feedback asks for run-proven review findings, an explicit orchestration decision, and a bounded project pilot. Offline checks below do not replace that future project pilot.

## Every upstream file changed since 0.15.34

Paths are relative to upstream `pstack/`. This is a selective multi-host alignment, not full upstream parity.

| Upstream file | Decision and reason |
| --- | --- |
| `.cursor-plugin/plugin.json` | Excluded Cursor manifest; generator versions the supported host manifests. |
| `README.md` | Keep multi-host installation and update the actual fork reference descriptions. |
| `docs/guide/04-design.md` | Excluded guide. Interrogate itself adopts demonstrated failures and lead reproduction. |
| `docs/guide/07-overnight.md` | Excluded guide. Retain the installed durable helper contract rather than Cursor Project-only storage. |
| `docs/guide/10-recipes-and-pitfalls.md` | Excluded guide. Installed recipes use Dropped findings and the no-merge trigger. |
| `plugin.json` | Excluded upstream manifest; retain existing host packaging. |
| `skills/arena/SKILL.md` | Retain configured alias seats and effort/provider choices. Try the saved judge pool in preference order and disclose reduced diversity. Do not replace explicit aliases to manufacture another family. |
| `skills/interrogate/SKILL.md` | Adopt run-proven failures and coordinator reruns; adapt native isolated reviewers, saved choices, authority and blocked-evidence reporting. Retain the generated reviewer table. |
| `skills/interrogate/references/code-quality-review.md` | Delete the superseded review lens with upstream. |
| `skills/interrogate/references/lead-judgment.md` | Delete the superseded judgment buckets with upstream. |
| `skills/interrogate/references/reviewer-prompt.md` | Delete the superseded template with upstream. The new evidence brief lives in the skill. |
| `skills/interrogate/references/rubric.md` | Delete the superseded rubric with upstream. |
| `skills/ketchup-video/SKILL.md` | Still excluded; video remains optional and absent. |
| `skills/poteto-help/SKILL.md` | Adopt the no-merge trigger; retain links to installed playbooks and omit absent video. |
| `skills/poteto-help/references/recipes.md` | Adopt Dropped-list and no-merge wording. |
| `skills/poteto-mode/SKILL.md` | Adopt the initial intent restatement and pre-measurement decision rule; retain explicit authority, saved model/effort semantics, current topology and operator merge policy. |
| `skills/poteto-mode/playbooks/autonomous-run.md` | Adopt the goal-related boundary for mid-run discoveries. |
| `skills/poteto-mode/playbooks/autopilot-full.md` | Adopt evidence-based blockers, related concurrent-change rebasing and finished-unit externalization. Retain operator merges, bounded fix rounds and verification for instruction changes. |
| `skills/poteto-mode/playbooks/autopilot-stack.md` | Retain the existing single topology writer, chain safety, no-merge authority, STACK-READY report and loop precedence. |
| `skills/poteto-mode/playbooks/babysit.md` | Retain its pinned writable helper path and existing triage; do not introduce the conflicting upstream watcher path. |
| `skills/poteto-mode/playbooks/multi-phase-plan.md` | Retain durable location, topology-owner handoff, operator merge policy and required verification. |
| `skills/poteto-mode/playbooks/opening-a-pr.md` | Adopt removal of the redundant automatic Interrogate call; retain explicit independent-review gates and owner babysitting exception. |
| `skills/poteto-mode/playbooks/orchestrate.md` | Retain durable state, recovery, ownership, frontier and revision-bound verdicts. Prefer equivalent native tracking/events; a wake-up is not a completion supervisor. Cursor's Project tracker/store is not a portable replacement. |
| `skills/poteto-mode/scripts/orch/orch.test.ts` | Retain unchanged as port-only regression coverage after upstream deletion. |
| `skills/poteto-mode/scripts/orch/orch.ts` | Retain unchanged as the port-only bookkeeping entrypoint after upstream deletion. It does not own worker lifecycle. |
| `skills/poteto-mode/scripts/orch/store.ts` | Retain unchanged as port-only durable state and recovery after upstream deletion. |
| `skills/poteto-mode/scripts/package.json` | Retain orch in the test command and the existing locked helper package. |
| `skills/principle-explain-the-number/SKILL.md` | Adopt the decision and noise-floor rule before measurement. |
| `skills/setup-pstack/SKILL.md` | Retain active-host setup, saved alias/model/effort choices and routing preferences; do not adopt forced cross-family replacements. |

## Additional bounded changes and retained decisions

Adapted [backnotprop `02b59d7f73a693d40ad2090d00789f3e3a772151`](https://github.com/backnotprop/pstack/commit/02b59d7f73a693d40ad2090d00789f3e3a772151) only for no-comments: preserve unresolved external-rule comments, continue accepted work after one rejected retry, and report incomplete work explicitly. The canonical agent prompt generates its portable skills-only copy. No switch to that distribution or its models.

The CI matrix retains Pi 1.1.0 with the existing October 11 dependency cutoff and adds Pi 1.4.0 with an October 22 cutoff. Public npm metadata checked on October 28 reports latest stable 1.4.0, published October 21 at 22:48:58 UTC. The matrix checks types, catalog, startup, mock scheduler and native discovery without model calls. It does not update the installed Pi CLI or Companion dependencies.

Reflection's retained dependency closure and writable pinned-helper setup stay unchanged. Statechart, video and Benny automation stay excluded. Shipping, messages, ticket changes, deployment, provider spending and user settings remain governed by existing authorization. No publication or global installation is part of this patch.

## Validation boundaries

The generator and ownership check validate packaging and intentional forks. Native Pi/Codex catalogs validate metadata and selection. Fake-forge helpers validate pinned bootstrap, resumption and installation immutability. Mock loop tests validate scheduling and cancellation decisions. Independent instruction probes establish only the exercised scenarios. None is a live paid-provider run or proof of an unattended multi-outcome program. A bounded project pilot remains the next workflow evidence step.

---

# Prior bounded Cursor alignment, 0.9.104

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
