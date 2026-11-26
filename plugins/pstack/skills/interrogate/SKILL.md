---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Adversaries try to break a change or design, and only findings proven by a run survive."
---

# Interrogate

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

On Antigravity, read the [platform mapping](../poteto-mode/references/agy-tools.md), including its per-skill notes, before following this skill.

Adversaries try to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

## Frame

The scope is what the user names. Otherwise it is the branch diff from its merge base with the base branch, through the working tree. State the intent with the **in-your-own-words** skill, from the user's message, the commits, and the PR description. Ask the user when the intent is unclear.

## Fan out

Run Phase A steps 3 and 4 and Phase B of the **arena** skill, with four changes. Read the `interrogate reviewers` line in place of `arena runners`. Copy the scope's uncommitted changes into each worktree. Spawn each adversary as `general-purpose`, or the host's equivalent per its platform mapping. Honor saved model and effort choices; aliases omit the model override. If an entry cannot run, report the missing reviewer and follow the host mapping's capability and review-gate rules. Do not silently change providers or replace a saved choice to manufacture diversity. Report reduced model diversity when entries inherit the same model. In place of the arena task and rationale, give each adversary the scope, the intent, and this brief:

> Break this change. Prove each finding with a run against the real code, such as a failing test, a repro script, or command output that shows the wrong behavior. For a design or plan, run a prototype or probe the current tree. Keep repros in your own worktree. Report each finding with a title, the exact command, the output it printed, and the output the intent requires. Leave out anything you did not run. That covers style, naming, structure, and risks that need a future change to matter. Report blocked checks separately, with the exact action, target and reason; a blocked check is not a pass. No findings is a valid result.

Use the native agent tools the host exposes. Give each reviewer its own worktree or scratch output. Reviewers may create repros there, but must not edit the author's tree. A worktree or brief does not restrict inherited permissions. Every probe stays within the user's existing resource, action and spending authority; a review is no grant for provider calls, publication or external mutation.

## Verify

Verify each finding per arena Phase F by rerunning its command. Keep a finding when the output shows the failure and the failure breaks the intent. Drop the rest. Merge findings that share a root cause.

Skip arena Phases C, D, and E. Adversaries find different failures, so the verdict keeps every verified finding, not one adversary's list. Model agreement is context, not a substitute for reproduction.

If a relevant check cannot run within the current authority, report it as blocked and continue the independent checks. Keep any required independent-review gate closed until its missing evidence is resolved, per [poteto-mode's review gate](../poteto-mode/SKILL.md#subagents). An instruction or metadata probe does not establish live model compliance, process lifecycle, or production behavior.

## Output

- **Intent**: the restatement and the reviewed snapshot.
- **Reviewers**: which entries ran, any missing seats, and reduced diversity.
- **Findings**: for each verified finding, the command, its output, how it breaks the intent, and the adversaries that found it. Say "no verified findings" when none survive.
- **Dropped**: for each adversary, the count of dropped findings and why.
- **Blocked**: unresolved checks and their effect on the review gate. Do not present missing required evidence as a clean verdict.

## Models

Role defaults, stamped from `plugins/pstack/models.json` (edit there, rerun `tools/generate.mjs`). A matching role line in the `pstack-models.md` override sheet overrides each at runtime; `/setup-pstack` writes it and lists its path per runtime.

- interrogate reviewers: `opus`, `fable`, `sonnet`, `haiku`

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. On Claude Code, `session` sets no effort. On other runtimes, follow the platform mapping for `session`. Strip the suffix before reading the model: `inherit-parent` or `auto` still omits `model` at every level, and a model name is passed as `model`. Pass the level as the dispatch's effort field and keep the `subagent_type` you would otherwise use. That is `effort` on the Claude Code `Agent` call and `reasoning_effort` on Codex's `spawn_agent`. On Codex, pass `model` and `reasoning_effort` only as the platform mapping's schema check allows. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
