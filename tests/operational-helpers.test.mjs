// The default cases execute only the documented preparation guards with fakes.
// Opt in to the separate real locked bootstrap, in a disposable writable copy:
// PSTACK_TEST_HELPER_BOOTSTRAP=1 bun test tests/operational-helpers.test.mjs
import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { isolatedEnv } from "../tools/test-suites.mjs";

const repo = join(import.meta.dir, "..");
const guide = readFileSync(join(repo, "plugins/pstack/skills/poteto-mode/references/operational-helpers.md"), "utf8");
function block(marker) {
  const found = [...guide.matchAll(/```sh\n([\s\S]*?)\n```/g)].find((match) => match[1].startsWith(`# ${marker}\n`));
  if (!found) throw new Error(`Missing executable documentation block: ${marker}`);
  return found[1];
}
const prepare = block("pstack-helper-prepare");
const initialize = block("pstack-helper-initialize");
function run(command, args, { env, cwd, timeout = 30000 } = {}) {
  const result = spawnSync(command, args, { env, cwd, encoding: "utf8", timeout });
  if (result.error) throw result.error;
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}
function tree(directory) {
  const out = {};
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else out[relative(directory, path)] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
  };
  visit(directory); return out;
}

test("operational setup refuses relative state and a source check that failed with empty stdout", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "pstack-helper-guards-")));
  try {
    const env = { ...isolatedEnv(join(root, "env")), PIN: "a".repeat(40), ORCH_STORE: "relative-program", XDG_DATA_HOME: join(root, "data") };
    const relativeStore = run("sh", ["-c", prepare + '\nprintf "PREPARED"\n'], { env, cwd: root });
    expect(relativeStore.code).not.toBe(0);
    expect(relativeStore.stderr).toContain("ORCH_STORE must be absolute");
    const bin = join(root, "bin"); mkdirSync(bin);
    writeFileSync(join(bin, "git"), '#!/bin/sh\ncase "$*" in *rev-parse*) printf "%s\\n" "$PIN";; *status*) exit 23;; *) exit 99;; esac\n', { mode: 0o755 });
    mkdirSync(join(env.XDG_DATA_HOME, "pstack-helpers", env.PIN), { recursive: true });
    const failedStatus = run("sh", ["-c", prepare + '\nprintf "PREPARED"\n'], { cwd: root, env: { ...env, PATH: `${bin}:${env.PATH}`, ORCH_STORE: join(root, "program") } });
    expect(failedStatus.code).not.toBe(0);
    expect(failedStatus.stderr).toContain("Cannot verify helper source");
    expect(failedStatus.stdout).not.toContain("PREPARED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("Bun callers select the writable operational path, with the old installed-path instruction as a negative control", () => {
  const calls = [
    ["playbooks/orchestrate.md", "$HELPER_SCRIPTS/orch/orch.ts"],
    ["playbooks/babysit.md", "HELPER_SCRIPTS"],
    ["references/merge-safety.md", "HELPER_SCRIPTS/watch-pr/"],
  ];
  for (const [path, wanted] of calls) {
    const text = readFileSync(join(repo, "plugins/pstack/skills/poteto-mode", path), "utf8");
    expect(text).toContain("operational-helpers.md"); expect(text).toContain(wanted);
  }
  const assertOperationalTarget = (text) => {
    if (!text.includes('bun "$HELPER_SCRIPTS/orch/orch.ts"') || text.includes("under the installed plugin for bookkeeping")) {
      throw new Error("Bookkeeping still selects the immutable installed helper instead of the pinned writable checkout");
    }
  };
  const orchestrate = readFileSync(join(repo, "plugins/pstack/skills/poteto-mode/playbooks/orchestrate.md"), "utf8");
  assertOperationalTarget(orchestrate);
  const broken = orchestrate.replace('bun "$HELPER_SCRIPTS/orch/orch.ts"', "bun skills/poteto-mode/scripts/orch/orch.ts under the installed plugin for bookkeeping");
  expect(() => assertOperationalTarget(broken)).toThrow("Bookkeeping still selects the immutable installed helper");
});

test.skipIf(process.env.PSTACK_TEST_HELPER_BOOTSTRAP !== "1")("documented pinned helper setup bootstraps outside the installation and resumes one durable program with a fake forge", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "pstack-operational-helper-")));
  try {
    const env = isolatedEnv(join(root, "first-shell"));
    const source = join(root, "source"), installed = join(root, "plugin-only-install"), store = join(root, "durable-program");
    const gitEnv = { ...env, GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid", GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
    const git = (cwd, ...args) => {
      const result = run("git", args, { cwd, env: gitEnv });
      if (result.code !== 0) throw new Error(result.stderr);
      return result.stdout.trim();
    };
    mkdirSync(source);
    cpSync(join(repo, "plugins"), join(source, "plugins"), { recursive: true });
    cpSync(join(repo, ".gitignore"), join(source, ".gitignore"));
    git(source, "init", "--quiet", "-b", "main"); git(source, "add", "."); git(source, "commit", "--quiet", "-m", "Candidate plugin fixture");
    const pin = git(source, "rev-parse", "HEAD");
    cpSync(join(source, "plugins/pstack"), installed, { recursive: true });
    const before = tree(installed);
    const common = { PIN: pin, PSTACK_REPOSITORY: source, ORCH_STORE: store, XDG_DATA_HOME: join(root, "persistent-data") };
    const checkout = join(common.XDG_DATA_HOME, "pstack-helpers", pin);
    const scripts = join(checkout, "plugins/pstack/skills/poteto-mode/scripts");
    const first = run("sh", ["-c", prepare + "\n" + initialize + '\nbun "$HELPER_SCRIPTS/orch/orch.ts" unit add task-1 --track sample\n'], { env: { ...env, ...common }, cwd: root, timeout: 60000 });
    expect(first.code, first.stdout + first.stderr).toBe(0);
    expect(tree(installed)).toEqual(before);
    expect(existsSync(join(installed, "skills/poteto-mode/scripts/node_modules"))).toBe(false);
    expect(git(checkout, "rev-parse", "HEAD")).toBe(pin);
    const key = join(scripts, "node_modules/.poteto-mode-tools-install-key");
    const installKey = readFileSync(key, "utf8");
    expect(JSON.parse(readFileSync(join(scripts, "node_modules/commander/package.json"), "utf8")).version).toBe("14.0.0");
    expect(readFileSync(join(scripts, "bun.lock"))).toEqual(readFileSync(join(installed, "skills/poteto-mode/scripts/bun.lock")));

    const program = join(root, "program-repo"), bin = join(root, "bin"); mkdirSync(program); mkdirSync(bin);
    git(program, "init", "--quiet", "-b", "main"); writeFileSync(join(program, "file"), "base\n"); git(program, "add", "."); git(program, "commit", "--quiet", "-m", "Base");
    git(program, "switch", "--quiet", "-c", "topic"); writeFileSync(join(program, "file"), "candidate\n"); git(program, "commit", "--quiet", "-am", "Candidate");
    git(program, "remote", "add", "origin", "https://github.com/fixture/project.git");
    const sha = git(program, "rev-parse", "HEAD");
    const pr = JSON.stringify([{ number: 1, state: "OPEN", headRefName: "topic", baseRefName: "main", headRepository: { name: "project" }, headRepositoryOwner: { login: "fixture" } }]);
    writeFileSync(join(bin, "gh"), `#!/bin/sh\ncase "$*" in "pr list --head topic "*) printf '%s\\n' '${pr}';; "pr list --base topic "*) printf '[]\\n';; *) echo 'Unexpected fake forge command' >&2; exit 90;; esac\n`, { mode: 0o755 });
    const resumedEnv = { ...isolatedEnv(join(root, "second-shell")), ...common, PATH: `${bin}:${env.PATH}` };
    const resumed = run("sh", ["-c", prepare + '\nbun "$HELPER_SCRIPTS/orch/orch.ts" unit set task-1 --state verified\nbun "$HELPER_SCRIPTS/orch/orch.ts" frontier set --repo "$PROGRAM_REPO"\nbun "$HELPER_SCRIPTS/orch/orch.ts" status --json\n'], { env: { ...resumedEnv, PROGRAM_REPO: program }, cwd: root });
    expect(resumed.code, resumed.stdout + resumed.stderr).toBe(0);
    expect(resumed.stdout).toContain("verified");
    const frontier = JSON.parse(readFileSync(join(store, "frontier.json"), "utf8"));
    expect(JSON.stringify(frontier)).toContain(sha);
    expect(readFileSync(join(store, "units.tsv"), "utf8")).toContain("task-1\tsample\tverified");
    expect(readFileSync(key, "utf8")).toBe(installKey);
    expect(git(checkout, "rev-parse", "HEAD")).toBe(pin);
    expect(tree(installed)).toEqual(before);
    console.log(`Operational helper round trip: exact fixture pin ${pin}, Commander 14.0.0, two isolated shells, same helper/store, fake forge; installed tree unchanged.`);
  } finally { rmSync(root, { recursive: true, force: true }); }
}, 90000);
