---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"multi-model review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Adversaries try to break a change or design, and only findings proven by a run survive."
---

# Interrogate

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Adversaries try to break a change or a design. A finding survives only when a run proves it. Report the findings. Do not apply fixes.

## Frame

Use the scope the user names. Otherwise review the branch from its merge base with the base branch through the working tree, including scoped uncommitted and untracked files. State the intent in your own words from the user's message, commits and PR description. Ask only when a material intent decision remains unclear after reading those sources.

## Fan out

Read the `interrogate reviewers` line in the active host's `pstack-models.md`. Spawn one reviewer per entry, including `auto` and `inherit-parent`. If the line is absent, use the table defaults through the host mapping. Honor saved model and effort choices; aliases omit the model override. If an entry cannot run, report the missing reviewer and follow the host mapping's capability and review-gate rules. Do not silently change providers or replace a saved choice to manufacture diversity. Report reduced model diversity when entries inherit the same model.

| Subagent | Default model |
|----------|---------------|
| Reviewer A | `opus` |
| Reviewer B | `fable` |
| Reviewer C | `sonnet` |
| Reviewer D | `haiku` |

Use the native agent tools exposed by the host. On Claude Code the reviewer type is `general-purpose`. Give each reviewer its own worktree or scratch output, with the scoped uncommitted changes copied into its snapshot. Reviewers may create repros there, but must not edit the author's tree. A worktree or brief does not restrict inherited permissions. Every probe stays within the user's existing resource, action and spending authority; a review is no grant for provider calls, publication or external mutation.

Give every reviewer the scope, intent, source snapshot and this brief:

> Break this change. Prove each finding with a run against the real code, such as a failing test, repro script, or command showing wrong behavior. For a design, plan or instruction change, run a bounded prototype or workflow probe against the relevant artifacts and label what that probe establishes. Keep repros in your own workspace. Report the title, source location, exact command, observed output, expected output and how the mismatch breaks the intent. Leave out style preferences, speculative future failures and anything you did not check. No findings is valid. Report blocked checks separately, with the exact action, target and reason; a blocked check is not a pass.

## Verify

Rerun each reported finding's command against the same scoped source snapshot. Preserve its raw evidence. Keep it when the output demonstrates a failure of the stated intent; drop it when the run does not reproduce or the behavior is outside scope. Merge findings with the same root cause. Model agreement is context, not a substitute for reproduction.

If a relevant check cannot run within the current authority, report it as blocked and continue independent checks. Keep any required independent-review gate closed until its missing evidence is resolved, per [poteto-mode's review gate](../poteto-mode/SKILL.md#subagents). An instruction or metadata probe does not establish live model compliance, process lifecycle, or production behavior.

## Output

- **Intent:** the restatement and reviewed snapshot.
- **Reviewers:** which entries ran, any missing seats and reduced diversity.
- **Findings:** each verified failure, its command, observed and expected output, and the reviewers who found it. Say "no verified findings" when none survive.
- **Dropped:** counts by reviewer and reasons.
- **Blocked:** unresolved checks and their effect on the review gate. Do not present missing required evidence as a clean verdict.

## Reasoning effort

A role value in the override sheet may name a reasoning effort after its model, as in `opus @xhigh`. Levels on Claude Code: `low`, `medium`, `high`, `xhigh`, `max`. Which ones apply depends on the model. A value without `@` takes the sheet's `default effort` line, a level or `session`, and `session` when the sheet has no such line. `session` sets no effort, so the dispatch is the usual one. Strip the suffix before reading the model: `inherit-parent` or `auto` still omits `model` at every level, and a model name is passed as `model`. Pass the level as the dispatch's effort field and keep the `subagent_type` you would otherwise use. That is `effort` on the Claude Code `Agent` call and `reasoning_effort` on Codex's `spawn_agent`. On Muse it is `effort` on a Workflow child; a `subagent_spawn` dispatch keeps the session's effort.
