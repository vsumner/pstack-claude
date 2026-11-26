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
  const pi = read("poteto-mode/references/pi-tools.md");
  const codex = read("poteto-mode/references/codex-tools.md");
  expect(pi).toContain("`.agents/skills/verify/`");
  expect(codex).toContain("New Codex drivers default to `.agents/skills/verify/`");
  expect(generator).not.toMatch(/^(?:Write|Create) `\.claude\/skills\//m);
  expect(generator).toContain("Name it `verify`");
});

test("creation, maintenance, callers and personal modes share the same path policy", () => {
  // Skills that still carry the fork's shared location reference link it directly;
  // the rest resolve their root through the per-skill notes in the Pi mapping.
  for (const file of [
    "maintain-verification-skill/SKILL.md",
    "create-formal-verification-skill/SKILL.md", "maintain-formal-verification-skill/SKILL.md",
    "automate-me/SKILL.md", "poteto-help/SKILL.md",
    "poteto-mode/playbooks/authoring-a-skill.md",
  ]) expect(read(file)).toContain("project-skills.md");
  const pi = read("poteto-mode/references/pi-tools.md");
  for (const skill of ["create-verification-skill", "poteto-mode"]) expect(pi).toContain(`| \`${skill}\` |`);
  const maintenance = read("maintain-verification-skill/SKILL.md");
  expect(maintenance).toContain("do not assume a particular driver name");
  expect(maintenance).toContain("Preserve the selected skill's existing path and name");
  expect(pi).toContain("`.agents/skills/<handle>-mode/SKILL.md`");
  expect(pi).toContain("`skills/` folder for a personal one");
  expect(pi).not.toMatch(/^Look recursively for `\.claude\/skills/m);
});

test("runtime mappings and reflection recognize host roots without requiring a config change", () => {
  for (const host of ["pi", "codex", "copilot", "muse"]) {
    expect(read(`poteto-mode/references/${host}-tools.md`)).toContain("project-skills.md");
  }
  expect(read("reflect/SKILL.md")).toContain("route each to an edit on an existing skill");
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
