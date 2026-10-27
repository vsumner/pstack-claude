// Actual copies and native catalogs, not model compliance or execution.
import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { copyLocalSkill } from "../plugins/pstack/skills/reflect/scripts/copy-local-skill.mjs";
import { markdownFiles } from "../tools/validate-skills.mjs";

const repo = join(import.meta.dir, "..");
const plugin = join(repo, "plugins/pstack");
export function assertLocalDependencies(directory) {
  const missing = [];
  for (const file of markdownFiles(directory)) {
    for (const [, raw] of readFileSync(file, "utf8").matchAll(/\]\((<[^>]+>|[^)\s]+)\)/g)) {
      const target = raw.startsWith("<") ? raw.slice(1, -1) : raw;
      if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
      const path = target.split("#")[0];
      if (!existsSync(resolve(dirname(file), decodeURIComponent(path)))) missing.push(`${file}: ${target}`);
    }
  }
  if (missing.length) throw new Error(`Local override has missing dependencies:\n${missing.join("\n")}`);
}

test("plugin-only local copy preserves nested dependencies, source identity and only one discoverable skill", () => {
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), "pstack-local-copy-")));
  try {
    const installed = join(fixture, "installed plugin"), root = join(fixture, "project/.agents/skills");
    cpSync(plugin, installed, { recursive: true }); mkdirSync(root, { recursive: true });
    const retained = join(fixture, "retained-pin");
    const guide = readFileSync(join(plugin, "skills/poteto-mode/references/local-skill-overrides.md"), "utf8");
    const retain = [...guide.matchAll(/```sh\n([\s\S]*?)\n```/g)].find((match) => match[1].startsWith("# pstack-retain-plugin\n"))[1];
    execFileSync("sh", ["-c", retain], { env: { PATH: process.env.PATH, SOURCE_PLUGIN: installed, RETAINED_PLUGIN: retained }, encoding: "utf8" });
    expect(() => execFileSync("sh", ["-c", retain], { env: { PATH: process.env.PATH, SOURCE_PLUGIN: installed, RETAINED_PLUGIN: retained }, stdio: "pipe" })).toThrow();
    const source = join(retained, "skills/reflect"), destination = join(root, "reflect-local");
    const before = readFileSync(join(source, "SKILL.md"));
    const installedEntries = readdirSync(installed, { recursive: true }).sort();
    let rejected;
    try { execFileSync("sh", ["-c", retain], { env: { PATH: process.env.PATH, SOURCE_PLUGIN: installed, RETAINED_PLUGIN: join(installed, "nested-retained") }, stdio: "pipe" }); }
    catch (error) { rejected = error; }
    expect(rejected?.stderr.toString()).toContain("Retained copy must be outside the installed source");
    expect(readdirSync(installed, { recursive: true }).sort()).toEqual(installedEntries);
    const result = copyLocalSkill(source, destination);
    expect(result.source).toBe(source);
    expect(result.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.localName).toBe("reflect-local");
    expect(readFileSync(join(destination, ".pstack-source.json"), "utf8")).toContain(result.sourceSha256);
    expect(readFileSync(join(destination, "SKILL.md"), "utf8")).toContain("name: reflect-local");
    assertLocalDependencies(destination);
    expect(readFileSync(join(destination, "references/judgment-reviewer.md"), "utf8")).toContain(join(retained, "skills/poteto-mode/references/project-skills.md"));
    expect(readdirSync(root)).toEqual(["reflect-local"]);
    expect(readFileSync(join(source, "SKILL.md"))).toEqual(before);
    expect(() => copyLocalSkill(source, destination)).toThrow("Destination already exists");
    expect(() => copyLocalSkill(source, join(root, "reflect"))).toThrow("distinct local skill name");

    // A host cache update must not invalidate dependencies of the local copy.
    rmSync(installed, { recursive: true });
    assertLocalDependencies(destination);

    // Restore the reported defect, including the nested reviewer links. This
    // must fail on the absent sibling path, not parsing or host startup.
    const broken = join(fixture, "broken/reflect-local");
    cpSync(source, broken, { recursive: true });
    expect(() => assertLocalDependencies(broken)).toThrow("../poteto-mode/references/codex-tools.md");
    expect(() => assertLocalDependencies(broken)).toThrow("../../poteto-mode/references/project-skills.md");
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test("copy preflight refuses missing dependencies, source symlinks and writes inside the package", () => {
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), "pstack-copy-guard-")));
  try {
    const source = join(fixture, "plugin/skills/example"), root = join(fixture, "local");
    mkdirSync(source, { recursive: true }); mkdirSync(root);
    writeFileSync(join(source, "SKILL.md"), '---\nname: example\ndescription: Fixture.\n---\n[missing](../absent/file.md)\n');
    const destination = join(root, "example-local");
    expect(() => copyLocalSkill(source, destination)).toThrow("Missing source dependency");
    expect(existsSync(destination)).toBe(false);
    writeFileSync(join(source, "SKILL.md"), '---\nname: example\ndescription: Fixture.\n---\n');
    symlinkSync(join(source, "SKILL.md"), join(source, "linked.md"));
    expect(() => copyLocalSkill(source, destination)).toThrow("Unsupported skill entry");
    expect(existsSync(destination)).toBe(false);
    expect(() => copyLocalSkill(source, join(dirname(source), "example-local"))).toThrow("outside the source package");
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

test("relative link forms preserve internal files, fragments, titles and pinned paths with spaces", () => {
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), "pstack-copy-links-")));
  try {
    const source = join(fixture, "source/example"), root = join(fixture, "local");
    mkdirSync(source, { recursive: true }); mkdirSync(root);
    writeFileSync(join(source, "inside.md"), "# Inside\n");
    writeFileSync(join(dirname(source), "outside file.md"), "# Outside\n");
    writeFileSync(join(source, "SKILL.md"), '---\nname: example\ndescription: Fixture.\n---\n[inside](inside.md#inside)\n[outside](<../outside file.md#outside> "Title")\n[reference][external]\n[external]: ../outside%20file.md#outside "Other title"\n');
    const result = copyLocalSkill(source, join(root, "example-local"));
    const contents = readFileSync(result.path, "utf8");
    expect(contents).toContain("[inside](inside.md#inside)");
    expect(contents).toContain(`<${join(dirname(source), "outside file.md")}#outside> "Title"`);
    expect(contents).toContain(`[external]: <${join(dirname(source), "outside file.md")}#outside> "Other title"`);
    assertLocalDependencies(dirname(result.path));
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

const piDir = process.env.PI_PACKAGE_DIR;
test.skipIf(!piDir || !existsSync(join(piDir, "dist/core/skills.js")))("Pi's native catalog selects the distinct local override without copying sibling skills", async () => {
  const { DefaultPackageManager } = await import(pathToFileURL(join(piDir, "dist/core/package-manager.js")).href);
  const { loadSkills } = await import(pathToFileURL(join(piDir, "dist/core/skills.js")).href);
  const fixture = realpathSync(mkdtempSync(join(tmpdir(), "pstack-pi-override-")));
  try {
    const installed = join(fixture, "installed"), project = join(fixture, "project"), agentDir = join(fixture, "pi");
    cpSync(join(repo, "package.json"), join(fixture, "package.json"));
    cpSync(plugin, join(installed, "plugins/pstack"), { recursive: true });
    cpSync(join(repo, "package.json"), join(installed, "package.json"));
    const root = join(project, ".agents/skills"); mkdirSync(root, { recursive: true }); mkdirSync(agentDir);
    const retained = join(fixture, "retained-pin"); cpSync(join(installed, "plugins/pstack"), retained, { recursive: true });
    const result = copyLocalSkill(join(retained, "skills/reflect"), join(root, "reflect-local"));
    const settingsManager = { getGlobalSettings: () => ({ packages: [installed] }), getProjectSettings: () => ({}), isProjectTrusted: () => true };
    const paths = await new DefaultPackageManager({ cwd: project, agentDir, settingsManager }).resolve();
    const loaded = loadSkills({ cwd: project, agentDir, includeDefaults: false, skillPaths: paths.skills.filter((entry) => entry.enabled).map((entry) => entry.path) });
    const selected = loaded.skills.filter((skill) => skill.name === "reflect-local");
    expect(selected).toHaveLength(1);
    expect(selected[0].filePath).toBe(result.path);
    expect(readFileSync(selected[0].filePath, "utf8")).toContain("name: reflect-local");
    assertLocalDependencies(dirname(selected[0].filePath));
    expect(loaded.skills.filter((skill) => skill.name === "reflect")).toHaveLength(1);
    expect(loaded.skills.filter((skill) => skill.name === "poteto-mode")).toHaveLength(1);
    expect(loaded.diagnostics.filter((entry) => entry.type === "collision")).toEqual([]);
    expect(readdirSync(root)).toEqual(["reflect-local"]);
    console.log("Native Pi catalog: /skill:reflect-local identifies only the approved local file; no turn started.");
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
