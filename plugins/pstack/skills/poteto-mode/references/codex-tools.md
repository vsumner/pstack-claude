# Codex tool mapping for pstack

pstack skills are written in Claude Code tool language (the `Skill` tool, the `Agent` tool, `AskUserQuestion`, Claude model names). On Codex the skills are the same files; capabilities, tool schemas and lifecycle semantics come from the current host. Read this when a pstack skill names a Claude tool, a driver or bundled skill, or a Claude model. This file is Codex-specific. Gemini CLI, opencode, Prime Agent, and other runtimes must use their own concrete tools, model names, and configuration paths.

## Tool actions

Resolve each action against the tools actually exposed in this session. Codex CLI, the desktop app and delegated environments can expose different names and schemas. Examples below are capabilities, not a universal API; never invent a missing tool or broaden permissions to obtain one.

| pstack / Claude action | Codex equivalent |
|------------------------|------------------|
| Read a file | A native file reader, or the exposed command tool (for example `exec_command` with `cat`) |
| Create / edit / delete a file | The exposed edit tool (for example `apply_patch`) |
| Run a shell command | The exposed command tool, for example `exec_command` |
| Search file contents / find files | The exposed search or command tool; prefer `rg` |
| Fetch a URL | The exposed browser/fetch tool, or an authorized command using `curl` |
| Search the web | The exposed web search capability; if absent, report it |
| Invoke a skill (the `Skill` tool, `/command`) | Skills load natively. Follow the instructions presented. |
| Dispatch a subagent (the `Agent`/`Task` tool) | The native `spawn_agent` or collaboration tool exposed by this host; use its current schema. |
| Request a read-only reviewer | Use a native read-only role or sandbox only when the host exposes one. Otherwise scope the brief and verify the resulting diff; a brief is not a sandbox. |
| Dispatch N parallel subagents in one turn | Independent native dispatch calls, when this host permits parallel dispatch |
| Wait for a subagent result | The native wait action exposed here, for example `wait` or `wait_agent` |
| Free a finished subagent slot | `close_agent`, when the session exposes it. Some Codex hosts don't. |
| Track tasks (the todolist; `TaskCreate` / `TaskUpdate`, or `TodoWrite` on Claude Code) | The native plan tool if exposed (for example `update_plan`); otherwise the workflow checklist |
| Ask the human a fixed-choice question (`AskUserQuestion`) | Use the structured question tool exposed by this host when its mode permits; otherwise ask in plain text. |
| Steer or continue a subagent | Use the current native send-input, message, or follow-up action and its actual schema. Preserve the fresh-agent rule below. |
| Stop a subagent | Use the native stop or interrupt action, confirm its reported status, and separately account for any subprocesses it left running. |

Check the native collaboration tools this host exposes first. Codex CLI 0.163 enables `multi_agent` by default. On older or explicitly disabled setups, the user can choose this configuration; do not change global config merely to follow the example:

```toml
[features]
multi_agent = true
```

When native dispatch is unavailable, the fan-out skills (`interrogate`, `why`, `how`, `arena`, `reflect`) degrade to a single sequential pass. A required independent review does not degrade. It stays blocked, as poteto-mode's [Subagents](../SKILL.md#subagents) section says.

Enabling `multi_agent` does not lift the host's thread limit. A thread-limit error from `spawn_agent` is a capacity error, not a rejected model slug, so the skills' fallback to another model does not apply. After the first capacity rejection, stop spawning. Close a finished agent with `close_agent` before you try again, and where the session has no `close_agent`, do not assume a finished agent's slot is free.

## Subagent policy

poteto-mode's Subagents section sets Claude-specific defaults (`subagent_type: "pstack:poteto-agent"`, `run_in_background: true`). On Codex:

- There is no `poteto-agent` subagent type. Route an ad-hoc subagent through poteto-mode's style by dispatching a `spawn_agent` whose instructions tell it to read the `poteto-mode` skill in full first.
- `spawn_agent` calls already run concurrently with your turn, so `run_in_background: true` has no separate flag. Issue the dispatch and continue.
- When a role value carries `@<level>`, or the `default effort` line names a level, pass that saved level only through an effort field this host exposes. `session` passes no effort override and delegates to native inheritance/defaults without an implicit adjustment by pstack. With no selected model override this normally keeps the parent's effort; an explicitly selected model can use its own default, depending on the host. A saved `inherit-parent` or `auto` model passes no model override. Host tool schemas and their model/effort restrictions take precedence.
- There is no `comment-sicko` subagent type either. The **no-comments** skill spawns it on Claude Code; on Codex dispatch a `spawn_agent` whose instructions tell it to read `poteto-mode/references/agents/comment-sicko.md` in full first.
- There are no `thermo-nuclear-review-subagent` or `thermo-nuclear-code-quality-review-subagent` types. The **thermos** skill spawns both on Claude Code; on Codex dispatch two `spawn_agent` calls whose instructions tell each to read the `thermo-nuclear-review` or `thermo-nuclear-code-quality-review` skill in full first and review only the diff and file contents in its prompt.
- Claude Code runs every subagent on this machine, so the **swarm** skill's workers and the fan-out playbooks (`orchestrate`, `autopilot-full`, `autopilot-stack`) isolate writers with worktrees. On Codex, check whether native dispatch supplies isolation; otherwise assign a separate worktree or output for each writer. A worktree does not restrict filesystem or network authority.
- Keep the rest of the policy unchanged. Pass file pointers not inlined context, give each worker its own worktree or branch when they write, review every subagent's diff yourself.

A worker's completion is a native task state, not a universal process-exit guarantee. Keep native waiting, messaging, interruption and closing in the host; do not add a separate process manager. Confirm an abandoned worker's stop and account separately for any background subprocesses it created. A role prompt or read-only brief does not lower inherited permissions.

## Model names

Skills name Claude defaults (a single-role default for code/prose/judgment, a worker model for feature and refactoring code, plus a diverse-model panel for diverse-model panels; each model-consuming skill lists its own in a Models section). These slugs do not resolve on Codex. Substitute your configured Codex models:

- Single-model roles: your primary Codex model (for example `gpt-6-sol`).
- Roles that default to the Claude worker model (`feature, refactoring`): your fast Codex code model (for example `gpt-6-sol`).
- Roles that default to the strongest Claude model (`strongest judgment`): your strongest Codex model (for example `gpt-6-astra`).
- Diverse-model panels (`arena`, `architect`, `interrogate`, `how` critics, `reflect`): the adversarial signal comes from model diversity, so use the distinct Codex models available to you. A good default panel on ChatGPT is `gpt-6-astra`, `gpt-6-sol`, `gpt-6-luna`. If only one model family is reachable, note in the verdict that diversity was reduced; vary reasoning effort only when the user selected those differences.

Before dispatching a pstack role, read `${CODEX_HOME:-$HOME/.codex}/pstack-models.md` if it exists. Treat its role choices as overrides. Without an explicit user-selected model or effort, inherit the host session settings; the examples above are not authorization to change providers or models. Use only arguments accepted by this host's current native tool schema. Keep global `AGENTS.md` unchanged; this invocation-time read loads the choices.

`/setup-pstack` writes the configured model list. On Codex, set it to your Codex model slugs.

## Session routing hook

The native pstack plugin bundles the same `SessionStart` routing instruction as the Claude Code plugin, through `session-start.sh` on macOS and Linux and `session-start.ps1` on Windows. Codex runs supported lifecycle events only after the user trusts the hook through `/hooks`. The hook reads `session hook` from the Codex sheet, at the path in [setup-pstack's runtime table](../../setup-pstack/SKILL.md#other-runtimes); `session hook: off` disables injection. Installation and explicit skill discovery do not require hook trust. Routing off does not disable the host's implicit skill selection, and is not permission to change invocation policy or trust.

A skills-only installation does not include plugin hooks. Request `poteto-mode` explicitly or add a standing instruction to `AGENTS.md` in that case.

## Driver and bundled skills pstack references

The [driver policy](../SKILL.md#non-negotiables) selects the app driver. For skills and drivers named by these workflows, use these Codex equivalents:

| Skill or driver named in pstack | On Codex |
|---------------------------------|----------|
| `run` (drive a CLI/TUI to see a change work) | Run the app yourself via the native command tool and observe the real output. |
| Project UI driver | Drive the UI with whatever automation you have, or hand the user a concrete manual check. Do not claim done without observing the artifact. |
| `plugin-dev:skill-development` (Claude's SKILL.md authoring guidance) | Follow your platform's skill-authoring guidance; the `writing-skills` skill if present. Keep `name` + `description` frontmatter and progressive disclosure. |
| `loop` (recurring/self-paced re-invocation, used by `babysit`) | Codex has no `loop` skill. Re-run the step yourself on a cadence, or use a Codex scheduled task if available. |

## Per-skill notes

Affected skill entry points and the optional Codex slash stubs point here. Most skills need only the tables above. These need one more mapping:

| Skill | On Codex |
|-------|----------|
| `interrogate` | Dispatch through the native subagent tool using its current schema. Role models follow Model names above; `readonly` requires an exposed native restriction, as Tool actions explains. Report any missing model diversity. |
| `setup-pstack` | The skill's Other runtimes table names the Codex sheet path and how it loads; the slugs are your Codex models (see Model names above). The role rows are identical. |
| `no-comments` | There is no `comment-sicko` subagent type; see Subagent policy above. |
| `thermos` | There are no thermo-nuclear subagent types; see Subagent policy above. |
| `teach` | Running `how` and `why` in parallel maps to `spawn_agent` fan-out; image generation uses the configured Codex equivalent. |
| `create-verification-skill` | Resolve [project skill locations](project-skills.md) first. New Codex drivers default to `.agents/skills/verify/`; preserve an existing or explicitly requested name and supported path. The app-driving harness is platform-neutral. |
| `maintain-verification-skill` | Per-feature source readers map to `spawn_agent`. Locate the actual driver and feature map through [project skill locations](project-skills.md); do not assume Claude Code's directory or a fixed driver name. |
| `create-formal-verification-skill` | Resolve the area-named skill through [project skill locations](project-skills.md). The verifier and its run command are platform-neutral. |
| `maintain-formal-verification-skill` | Search the active host's [project skill locations](project-skills.md) for the formal checker the user named or the code change affects, preserving its existing path. |
| `babysit` | `loop` and `AskUserQuestion` resolve through the tables above. |
| `automate-me` | Use the available skill-authoring guidance and this workspace's history only. Resolve project and personal output roots through [project skill locations](project-skills.md), preserving an existing mode skill's path and category. |
| `architect` | The runner panel goes through the **arena** skill, so its `spawn_agent` fan-out and model substitution apply here too. |
| `arena` | The parallel candidates and the cross-judge map to `spawn_agent`; substitute your configured Codex models for the runners and the cross-judge pool (see Model names above). |
| `how` | The parallel explorers and the explainer map to `spawn_agent` fan-out; substitute your configured Codex models. |
| `reflect` | The three reviewers and the synthesizer map to `spawn_agent`; substitute your configured Codex models. The transcript finder reads Claude Code's layout under `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/`, so pass the session digest step 1 allows instead. |
| `swarm` | Each worker is a `spawn_agent` call on your configured Codex model, and those calls already run concurrently; give each writing worker its own worktree or output directory (see Subagent policy above). |
| `why` | The parallel investigators and the synthesizer map to `spawn_agent`; substitute your configured Codex models. List MCP servers from the tools Codex exposes to the session, not from `.mcp.json` or `claude mcp list`. |

## Vendored scripts

The optional helpers keep their existing entrypoints. Read [helper prerequisites](helper-prerequisites.md) before invoking them: the Bun CLIs lazily install locked runtime dependencies into their own writable scripts directory, even for `--help`. A read-only cache is not a suitable bootstrap location. The Node worktree audit also scans session directories; scope transcript access to the current authorization.

## Instructions file

Where a pstack skill says "your instructions file", on Codex that is `AGENTS.md` (project root, plus `~/.codex/AGENTS.md` global). On Claude Code it is `CLAUDE.md`.
