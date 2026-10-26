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
  const setup = read("setup-pstack/SKILL.md");
  const wiring = setup.split("### 7. Wire it in")[1].split("### 8.")[0];
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
  expect(read("poteto-mode/SKILL.md")).toContain("the host mapping's inheritance and saved-choice rules take precedence over these adjustments");
  for (const host of ["pi", "codex"]) {
    const mapping = read(`poteto-mode/references/${host}-tools.md`);
    expect(mapping).toContain("without an implicit adjustment");
    expect(mapping).toContain("passes no model override");
  }
});

test("the workflow preserves existing authority instead of granting external-action permission", () => {
  const skill = read("poteto-mode/SKILL.md");
  expect(skill).toContain("A workflow or available MCP tool does not authorize messages");
  expect(skill).toContain("Apply authority the user already granted");
  expect(skill).not.toContain("external actions (team chat, ticket updates, kicking off evals) proceed without asking");
});
