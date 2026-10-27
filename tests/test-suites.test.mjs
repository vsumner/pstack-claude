import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { isolatedEnv, SAFE_TEST_FILES } from "../tools/test-suites.mjs";

test("safe selection never loads a lifecycle file, and a bad selection fails the sentinel", () => {
  const root = mkdtempSync(join(tmpdir(), "pstack-suite-selection-"));
  try {
    mkdirSync(join(root, "tools"));
    const script = join(root, "tools/test-suites.mjs");
    writeFileSync(script, readFileSync(join(import.meta.dir, "../tools/test-suites.mjs")));
    for (const file of SAFE_TEST_FILES) {
      const target = join(root, file); mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, 'import {test} from "bun:test"; test("safe fixture", () => {});\n');
    }
    const excluded = "tests/pi/agents-run.test.mjs";
    writeFileSync(join(root, excluded), 'throw new Error("LIFECYCLE_SENTINEL_LOADED");\n');
    const run = (...args) => spawnSync(process.execPath, [script, ...args], { cwd: root, env: isolatedEnv(join(root, "env")), encoding: "utf8" });
    const safe = run("safe");
    expect(safe.status, safe.stdout + safe.stderr).toBe(0);
    expect(safe.stdout + safe.stderr).not.toContain("LIFECYCLE_SENTINEL_LOADED");
    const badArgs = run("safe", excluded);
    expect(badArgs.status).toBe(2);
    expect(badArgs.stdout + badArgs.stderr).not.toContain("LIFECYCLE_SENTINEL_LOADED");
    const original = readFileSync(script, "utf8");
    writeFileSync(script, original.replace("export const SAFE_TEST_FILES = [", `export const SAFE_TEST_FILES = [\n  "${excluded}",`));
    const broken = run("safe");
    expect(broken.status).not.toBe(0);
    expect(broken.stdout + broken.stderr).toContain("LIFECYCLE_SENTINEL_LOADED");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("isolated test environment does not inherit provider keys or real host homes", () => {
  const root = mkdtempSync(join(tmpdir(), "pstack-test-env-"));
  try {
    const env = isolatedEnv(root, { PATH: "/fixture/bin", HOME: "/real/home", CODEX_HOME: "/real/codex", OPENAI_API_KEY: "fixture-key", ANTHROPIC_API_KEY: "fixture-key", GITHUB_TOKEN: "fixture-key" });
    expect(env.HOME).toBe(join(root, "home"));
    expect(env.CODEX_HOME).toBe(join(root, "codex"));
    expect(env.PATH).toBe("/fixture/bin");
    for (const key of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GITHUB_TOKEN"]) expect(env[key]).toBeUndefined();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
