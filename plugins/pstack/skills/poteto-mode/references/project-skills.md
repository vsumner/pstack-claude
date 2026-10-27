# Project skill locations

Resolve the active runtime before creating or locating a project skill. A repository containing `.claude/` does not make the current session Claude Code.

| Runtime | Default project skill root |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Pi | `.agents/skills/` |
| GitHub Copilot | `.github/skills/` |
| Muse | `.agents/skills/` |

On Pi, an existing `.pi/skills/` directory is also supported. For another runtime, use its verified discovery rules instead of assuming that it reads Claude Code's directory.

Before creating or maintaining a skill, inspect the project's existing `.agents/skills/`, `.claude/skills/`, and current-host native skill directories, plus any exact path the user named. These are project files to inspect, not additional discovery roots to enable. Match the skill's body and frontmatter, not only a directory called `verify`: an older driver may be named `verify-<app>`, and the user may have chosen another name. Preserve its name, category, feature map and location when updating it. If several compatible candidates exist, ask which one to maintain. Do not create a duplicate because it lives outside the default root.

An existing skill that this host does not discover can be read by its exact path when authorized. That does not register it with the host. In particular, Pi does not automatically discover `.claude/skills/`. Do not move existing skills, change host configuration, or change project trust merely to make them discoverable.

For a new skill, resolve `<project-skills>` to the table's root, or an existing supported project root the user selected. Write `<project-skills>/<name>/SKILL.md`, with matching `name` frontmatter. In a monorepo, use the touched package's project root. Put the skill's feature map and helpers inside that same resolved directory. Replace every placeholder with the actual path in the generated instructions.

The verification generator defaults to `verify`. On Claude Code that name replaces its bundled user-only command. Honor an explicitly requested name such as `verify-app`; callers must then use that actual skill name or path. This naming rule does not turn a formal checker into an app-driving skill.

For personal mode skills, resolve `<personal-skills>` from the active host too. Claude Code uses `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/`; Pi and Codex support `~/.agents/skills/`, and Pi also supports its agent directory's `skills/`. Preserve an existing supported location. Consult the other host's mapping rather than borrowing Claude's personal directory.

After writing, report the exact skill path and the host's invocation form. Pi uses `/skill:<name>`. In Codex, select the actual skill entry from the `$` picker. Claude Code uses the project skill's slash command. Check discovery with the current host when permitted; frontmatter and a directory alone do not prove successful invocation.
