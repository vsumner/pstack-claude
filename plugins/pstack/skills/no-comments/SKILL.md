---
name: no-comments
description: "Spawn the comment-sicko subagent, fix accepted findings, and offer encodings for claimed constraints."
---

# No comments

On Codex, read the [platform mapping](../poteto-mode/references/codex-tools.md), including its per-skill notes, before following this skill.

On GitHub Copilot, read the [platform mapping](../poteto-mode/references/copilot-tools.md), including its per-skill notes, before following this skill.

On Muse, read the [platform mapping](../poteto-mode/references/muse-tools.md), including its per-skill notes, before following this skill.

Spawn comment-sicko. Act on accepted findings.

Defer to comment-sicko's fresh perspective.

## Scope

Use the caller's files or diff. Otherwise use the current diff against the base branch, default `main`, including the working tree.

## Steps

1. Spawn `Agent` with `subagent_type: "pstack:comment-sicko"`. Pass the scope. Pick each subagent's reasoning level for the job, per the Subagents section of the **poteto-mode** skill. Do not restate its rules.
2. Inspect its report and diff. Reject application-code edits, scope escapes, exception-protected deletions and flags that misstate a current problem. Audit missed scoped lint and TypeScript suppressions; correctness and safety suppressions stay actionable `MUST KILL`s. For disputed `IMPORTANT` or `do not remove` claims, inspect the named symbol with `/how` or `/why` before judging. Keep an unverifiable external-rule comment verbatim as `REVIEW`, with its claimed rule and missing evidence. Restore an external-rule deletion when the claim remains unverifiable; uncertainty is not proof it is false. Our-code reshape findings remain actionable.

   Keep accepted findings and revert rejected edits. Request one fresh review of the rejected set with the failure named. If that review is also rejected, revert only its rejected edits, report those findings open, and continue with the accepted set. Report the unresolved portion as incomplete; do not claim the whole pass is clean.
3. Fix trivial accepted flags directly by deleting a dead path, dropping a parameter, or using the real API. If any fix needs a shape, run `/architect` once for the accepted set and surrounding code. Stop at the sketch. Architect shapes. Step 4 implements.
4. Implement the smallest root-cause fix in scope. Remove every named workaround. If the root cause is out of scope, land the smallest in-scope fix and report the rest open. The **principle-fix-root-causes** and **principle-redesign-from-first-principles** skills guide intent only. Neither authorizes widening the fence nor fixing instances outside it. Never bolt on symptom guards.
5. Constraint comments say `do not remove`, `do not change wording`, or `talk to X before changing`. Leave keeps about things we cannot change, including unresolved external-rule `REVIEW` keeps. Do not delete those in this step. Offer the cheapest in-scope type, runtime, test, or CI lint. Use existing caller approval when it covers that encoding; otherwise wait for approval. Unattended and eval require caller pre-approval. If approved, encode then delete. Otherwise delete, report the constraint open, and sketch out-of-scope work.
6. Report the deletion count, restored comments, `REVIEW` keeps and their missing evidence, reruns, architect sketch, fixes, encoding offers, encodings, unenforced constraints, and other open work.
