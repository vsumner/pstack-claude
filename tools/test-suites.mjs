// Explicit subsets: adding a test does not silently expand restricted coverage.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const SAFE_TEST_FILES = [
  "tests/agent-skills.test.mjs",
  "tests/claude-config-dir.test.mjs",
  "tests/codex-discovery.test.mjs",
  "tests/generate.test.mjs",
  "tests/host-compatibility.test.mjs",
  "tests/local-skill.test.mjs",
  "tests/operational-helpers.test.mjs",
  "tests/project-skills.test.mjs",
  "tests/readme-facts.test.mjs",
  "tests/runtime-packaging.test.mjs",
  "tests/skill-references.test.mjs",
  "tests/skill-rules.test.mjs",
  "tests/sync.test.mjs",
  "tests/test-suites.test.mjs",
  "tests/pi/config.test.mjs",
  "tests/pi/path-skills.test.mjs",
  "tests/pi/prompt.test.mjs",
];

// AgentRunner.start inspects real child identity (/proc or ps), including with
// a fake model transport. These and other child-lifecycle checks need the
// host's process permissions. Choosing this suite does not grant permissions.
export const PROCESS_TEST_FILES = [
  "tests/pi/agent-transcript-command.test.mjs",
  "tests/pi/agents-activity.test.mjs",
  "tests/pi/agents-launch.test.mjs",
  "tests/pi/agents-messages.test.mjs",
  "tests/pi/agents-run.test.mjs",
  "tests/pi/agents-session.test.mjs",
  "tests/pi/child.test.mjs",
  "tests/pi/fake-pi.test.mjs",
  "tests/pi/interaction.test.mjs",
  "tests/pi/runtime.test.mjs",
  "tests/pi/sleep-wait.test.mjs",
  "tests/pi/worktree.test.mjs",
];

export function suiteFiles(name) {
  if (name === "safe") return SAFE_TEST_FILES;
  if (name === "process") return PROCESS_TEST_FILES;
  throw new Error("Usage: bun tools/test-suites.mjs [safe|process]");
}

// No inherited provider keys, auth stores, host settings or Git hooks. This
// limits ambient inputs; a temporary HOME is not a security sandbox.
export function isolatedEnv(root, source = process.env) {
  for (const dir of ["home", "tmp", "pi", "codex", "claude", "config", "cache", "data", "empty-hooks"]) mkdirSync(join(root, dir), { recursive: true });
  const gitConfig = join(root, "empty-gitconfig");
  writeFileSync(gitConfig, "");
  const env = {};
  for (const key of ["PATH", "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "PI_PACKAGE_DIR", "PSTACK_CODEX_BINARY", "PSTACK_CODEX_REQUIRE_DISCOVERY"]) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  return {
    ...env,
    HOME: join(root, "home"), USERPROFILE: join(root, "home"),
    TMPDIR: join(root, "tmp"), TMP: join(root, "tmp"), TEMP: join(root, "tmp"),
    PI_CODING_AGENT_DIR: join(root, "pi"), CODEX_HOME: join(root, "codex"), CLAUDE_CONFIG_DIR: join(root, "claude"),
    XDG_CONFIG_HOME: join(root, "config"), XDG_CACHE_HOME: join(root, "cache"), XDG_DATA_HOME: join(root, "data"),
    GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_SYSTEM: gitConfig,
    GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "core.hooksPath", GIT_CONFIG_VALUE_0: join(root, "empty-hooks"), GIT_TERMINAL_PROMPT: "0",
    DO_NOT_TRACK: "1", NO_COLOR: "1", TZ: "UTC",
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let files;
  try {
    if (process.argv.length > 3) throw new Error("Usage: bun tools/test-suites.mjs [safe|process]");
    files = suiteFiles(process.argv[2] ?? "safe");
  } catch (error) {
    console.error(error.message); process.exit(2);
  }
  const root = mkdtempSync(join(tmpdir(), "pstack-test-suite-"));
  try {
    const result = spawnSync(process.execPath, ["test", ...files.map((file) => `./${file}`)], {
      cwd: fileURLToPath(new URL("..", import.meta.url)), env: isolatedEnv(root), stdio: "inherit",
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
