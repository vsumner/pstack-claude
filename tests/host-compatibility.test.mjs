// These are instruction-output contracts. They do not prove model compliance.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadModels } from "../tools/generate.mjs";
import { codexModelNamesSection, piModelNamesSection } from "../tools/runtimes.mjs";

const skills = join(import.meta.dir, "../plugins/pstack/skills");
const read = (path) => readFileSync(join(skills, path), "utf8");

test("Codex's generated model guidance reads saved choices without changing global instructions", () => {
  const text = codexModelNamesSection(loadModels());
  expect(text).toContain("`${CODEX_HOME:-$HOME/.codex}/pstack-models.md`");
  expect(text).toContain("Without an explicit user-selected model or effort, inherit the host session settings");
  expect(text).toContain("Keep global `AGENTS.md` unchanged");
  const setup = read("setup-pstack/references/runtimes.md");
  const wiring = setup.split("**Step 7 (wire it in).**")[1].split("\n")[0];
  expect(wiring).toContain("Leave global `AGENTS.md` unchanged");
  const row = setup.split("\n").find((line) => line.startsWith("| Codex |"));
  expect(row).toContain("read at dispatch");
  expect(row).not.toContain("paste");
});

test("Pi's generated catalog guidance requires a listed choice rather than guessing a replacement", () => {
  const text = piModelNamesSection(loadModels());
  expect(text).toContain("A shipped default can be absent on an older host");
  expect(text).toContain("Do not invent a replacement or switch providers");
  expect(text).toContain("use an `inherit-parent` role choice");
  expect(text).toContain("Catalog presence does not prove account access");
});

test("Pi and Codex saved effort choices override the shared adjustment policy", () => {
  expect(read("poteto-mode/SKILL.md")).toContain("The role's `@level`, or the sheet's `default effort` line, sets its starting level, and `session` starts from the session's level");
  expect(read("poteto-mode/references/pi-tools.md")).toContain("`inherit-parent`, `auto`, or no `model` runs the child on the parent's current model");
  expect(read("poteto-mode/references/codex-tools.md")).toContain("Without an explicit user-selected model or effort, inherit the host session settings");
});

test("the workflow preserves existing authority instead of granting external-action permission", () => {
  const skill = read("poteto-mode/SKILL.md");
  expect(skill).toContain("A workflow or available MCP tool does not authorize messages");
  expect(skill).toContain("Apply authority the user already granted");
  expect(skill).not.toContain("external actions (team chat, ticket updates, kicking off evals) proceed without asking");
});


test("host tool capabilities and completion do not assume one universal API", () => {
  const codex = read("poteto-mode/references/codex-tools.md");
  const pi = read("poteto-mode/references/pi-tools.md");
  const skill = read("poteto-mode/SKILL.md");
  expect(codex).toContain("not a universal API");
  expect(codex).toContain("`wait_agent`");
  expect(codex).toContain("do not add a separate process manager");
  expect(codex).not.toContain("| Run a shell command | `shell` |");
  expect(pi).toContain("`pi mcp list`");
  expect(skill).toContain("means the completion was *notified*, not that the process exited");
});

test("reflection copies use host roots and protect pinned installs", () => {
  const pi = read("poteto-mode/references/pi-tools.md");
  const codex = read("poteto-mode/references/codex-tools.md");
  for (const mapping of [pi, codex]) {
    expect(mapping).toContain("never edit the installed");
    expect(mapping).toContain("project-skills.md");
  }
  expect(pi).toContain("name collision keeps the project skill over the personal one");
});
