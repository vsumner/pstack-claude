// Instruction-output contracts plus an optional first-party Pi discovery check.
// These do not prove that a model follows the instructions.
import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dir, "../plugins/pstack/skills");
const read = (file) => readFileSync(join(root, file), "utf8");

test("project roots preserve Claude support and give Pi and Codex the shared discovered location", () => {
  const locations = read("poteto-mode/references/project-skills.md");
  for (const host of ["Pi", "Codex"]) expect(locations).toContain(`| ${host} | \`.agents/skills/\` |`);
  expect(locations).toContain("| Claude Code | `.claude/skills/` |");
  expect(locations).toContain("Do not move existing skills, change host configuration, or change project trust");
  expect(locations).toContain("That does not register it with the host");
  expect(locations).toContain("inspect the project's existing `.agents/skills/`, `.claude/skills/`");
  expect(locations).toContain("not additional discovery roots to enable");
});

test("driver output is resolved for Pi and Codex rather than written to Claude's directory", () => {
  const generator = read("create-verification-skill/SKILL.md");
  expect(generator).toContain("project-skills.md");
  expect(generator).toContain("`.agents/skills/` on Pi and Codex");
  expect(generator).toContain("Write `<driver-dir>/SKILL.md`");
  expect(generator).toContain("Create `<driver-dir>/features/README.md`");
  expect(generator).not.toMatch(/^(?:Write|Create) `\.claude\/skills\//m);
  expect(generator).toContain("`name: verify` by default, or the explicitly requested name");
});

test("creation, maintenance, callers and personal modes share the same path policy", () => {
  for (const file of [
    "create-verification-skill/SKILL.md", "maintain-verification-skill/SKILL.md",
    "create-formal-verification-skill/SKILL.md", "maintain-formal-verification-skill/SKILL.md",
    "automate-me/SKILL.md", "poteto-mode/SKILL.md", "poteto-help/SKILL.md",
    "poteto-mode/playbooks/authoring-a-skill.md",
  ]) expect(read(file)).toContain("project-skills.md");
  const maintenance = read("maintain-verification-skill/SKILL.md");
  expect(maintenance).toContain("do not assume a particular driver name");
  expect(maintenance).toContain("Preserve the selected skill's existing path and name");
  const personal = read("automate-me/SKILL.md");
  expect(personal).toContain("<project-skills>/<handle>-mode/SKILL.md");
  expect(personal).toContain("<personal-skills>/<handle>-mode/");
  expect(personal).not.toMatch(/^Look recursively for `\.claude\/skills/m);
});

test("runtime mappings and reflection recognize host roots without requiring a config change", () => {
  for (const host of ["pi", "codex", "copilot", "muse"]) {
    expect(read(`poteto-mode/references/${host}-tools.md`)).toContain("project-skills.md");
  }
  expect(read("poteto-mode/references/pi-tools.md")).not.toContain("add `../.claude/skills` to the `skills` list");
  for (const reviewer of ["judgment", "tooling", "divergent"]) {
    const text = read(`reflect/references/${reviewer}-reviewer.md`);
    expect(text).toContain("project-skills.md");
    expect(text).toContain("Route findings only to skills, tools, or MCPs this transcript used");
  }
});

const piDir = process.env.PI_PACKAGE_DIR;
const packageManager = piDir && join(piDir, "dist/core/package-manager.js");
test.skipIf(!packageManager || !existsSync(packageManager))("installed Pi discovers the portable project driver but not an unrelated Claude-only directory", async () => {
  const { DefaultPackageManager } = await import(pathToFileURL(packageManager).href);
  const { loadSkills } = await import(pathToFileURL(join(piDir, "dist/core/skills.js")).href);
  const fixture = mkdtempSync(join(tmpdir(), "pstack-project-skills-"));
  try {
    const project = join(fixture, "project"), agentDir = join(fixture, "agent");
    for (const [directory, name] of [[".agents", "verify-app"], [".claude", "claude-only-driver"]]) {
      const dir = join(project, directory, "skills", name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Test fixture driver.\n---\n# Driver\n`);
    }
    const settingsManager = { getGlobalSettings: () => ({}), getProjectSettings: () => ({}), isProjectTrusted: () => true };
    const paths = await new DefaultPackageManager({ cwd: project, agentDir, settingsManager }).resolve();
    const result = loadSkills({ cwd: project, agentDir, includeDefaults: false, skillPaths: paths.skills.filter((entry) => entry.enabled).map((entry) => entry.path) });
    const names = result.skills.map((skill) => skill.name);
    expect(names).toContain("verify-app");
    expect(names).not.toContain("claude-only-driver");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
