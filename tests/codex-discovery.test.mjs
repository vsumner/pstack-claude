// Native local registration and metadata only, in disposable homes: no hook
// execution, thread, model turn, real account or persistent user trust.
import { expect, test } from "bun:test";
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { isolatedEnv } from "../tools/test-suites.mjs";

const repo = join(import.meta.dir, "..");
const binary = process.env.PSTACK_CODEX_BINARY || Bun.which("codex");
const required = process.env.PSTACK_CODEX_REQUIRE_DISCOVERY === "1";
if (!binary && !required) console.warn("SKIP native Codex discovery: codex not found; set PSTACK_CODEX_BINARY or require it with PSTACK_CODEX_REQUIRE_DISCOVERY=1.");

function versionOf(output) {
  const version = /^codex-cli (\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/m.exec(output)?.[1];
  if (!version) throw new Error(`Unrecognized Codex version output: ${output.trim()}`);
  return version;
}

function requireMethods(schema, version) {
  const methods = new Set((schema.oneOf ?? []).flatMap((entry) => entry.properties?.method?.enum ?? []));
  const missing = ["initialize", "skills/list", "hooks/list"].filter((method) => !methods.has(method));
  if (missing.length) throw new Error(`Codex ${version} default exported protocol lacks ${missing.join(", ")}; native discovery was not verified.`);
}

test("native discovery rejects unknown versions and missing protocol capabilities", () => {
  expect(versionOf("codex-cli 0.163.0\n")).toBe("0.163.0");
  expect(() => versionOf("a different executable")).toThrow("Unrecognized Codex version output");
  const method = (name) => ({ properties: { method: { enum: [name] } } });
  expect(() => requireMethods({ oneOf: [method("initialize"), method("skills/list")] }, "fixture")).toThrow("lacks hooks/list");
  expect(() => requireMethods({ oneOf: ["initialize", "skills/list", "hooks/list"].map(method) }, "fixture")).not.toThrow();
});

function rpc(proc, version) {
  let id = 0, buffer = "", failed;
  const pending = new Map();
  const fail = (error) => {
    failed = error;
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  proc.once("error", fail);
  proc.once("exit", (code, signal) => fail(new Error(`Codex ${version} app-server exited (${code ?? signal})`)));
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk) => {
    buffer += chunk;
    for (;;) {
      const end = buffer.indexOf("\n");
      if (end < 0) break;
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      if (!line.trim()) continue;
      let data;
      try { data = JSON.parse(line); } catch { fail(new Error(`Codex ${version}: non-JSON protocol output`)); continue; }
      if (data.method && data.id !== undefined) { fail(new Error(`Unexpected server request during discovery: ${data.method}`)); continue; }
      const request = pending.get(data.id);
      if (!request) continue;
      pending.delete(data.id);
      if (data.error) request.reject(new Error(`${request.method}: ${JSON.stringify(data.error)}`));
      else request.resolve(data.result);
    }
  });
  return {
    request(method, params) {
      if (failed) return Promise.reject(failed);
      const requestId = ++id;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Codex ${version}: ${method} timed out`)); }, 8000);
        pending.set(requestId, {
          method,
          resolve: (value) => { clearTimeout(timer); resolve(value); },
          reject: (error) => { clearTimeout(timer); reject(error); },
        });
        proc.stdin.write(JSON.stringify({ id: requestId, method, params }) + "\n");
      });
    },
    initialized() { proc.stdin.write('{"method":"initialized"}\n'); },
  };
}

async function closeDiscovery(proc, root) {
  if (proc) {
    proc.stdin.end();
    if (proc.pid && proc.exitCode === null && proc.signalCode === null) {
      const exited = new Promise((resolve) => proc.once("exit", resolve));
      const timer = setTimeout(() => proc.kill("SIGTERM"), 2000);
      const force = setTimeout(() => proc.kill("SIGKILL"), 4000);
      let deadline;
      const unconfirmed = new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error(`Discovery app-server ${proc.pid} exit unconfirmed; fixture retained at ${root}`)), 6000); });
      try { await Promise.race([exited, unconfirmed]); } finally { clearTimeout(timer); clearTimeout(force); clearTimeout(deadline); }
    }
  }
}

function skill(dir, name) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Native discovery fixture, no commands.\n---\n# Fixture\n`);
}

test.skipIf(!binary && !required)("installed Codex discovers this checkout and project paths with untrusted hooks", async () => {
  if (!binary) throw new Error("PSTACK_CODEX_REQUIRE_DISCOVERY=1 but codex is missing.");
  const root = realpathSync(mkdtempSync(join(tmpdir(), "pstack-codex-discovery-")));
  const env = isolatedEnv(join(root, "env"));
  let proc;
  try {
    const command = (...args) => execFileSync(binary, args, { env, cwd: root, encoding: "utf8", timeout: 10000, killSignal: "SIGKILL" });
    const version = versionOf(command("--version"));
    const schemas = join(root, "schemas");
    command("app-server", "generate-json-schema", "--out", schemas);
    requireMethods(JSON.parse(readFileSync(join(schemas, "ClientRequest.json"), "utf8")), version);
    console.log(`Codex ${version}: default discovery protocol available; preparing fixture.`);
    const plugin = join(repo, "plugins/pstack");
    const pluginVersion = JSON.parse(readFileSync(join(plugin, ".codex-plugin/plugin.json"), "utf8")).version;
    const cached = join(env.CODEX_HOME, "plugins/cache/pstack-claude/pstack", pluginVersion);
    writeFileSync(join(env.CODEX_HOME, "config.toml"), [
      'cli_auth_credentials_store = "file"', 'mcp_oauth_credentials_store = "file"', "check_for_update_on_startup = false",
      "[analytics]", "enabled = false", "",
    ].join("\n"));
    command("plugin", "marketplace", "add", repo, "--json");
    const installed = JSON.parse(command("plugin", "add", "pstack@pstack-claude", "--json"));
    expect(installed.version).toBe(pluginVersion);
    expect(realpathSync(installed.installedPath)).toBe(realpathSync(cached));
    const project = join(root, "project"), cwd = join(project, "package");
    mkdirSync(cwd, { recursive: true });
    execFileSync("git", ["init", "--quiet", project], { env, cwd: root, stdio: "pipe", timeout: 10000 });
    skill(join(root, ".agents/skills/above-root-driver"), "above-root-driver");
    skill(join(project, ".agents/skills/root-driver"), "root-driver");
    skill(join(cwd, ".agents/skills/package-driver"), "package-driver");
    skill(join(project, ".agents/skills/collision-driver"), "collision-driver");
    skill(join(cwd, ".agents/skills/collision-driver"), "collision-driver");
    skill(join(project, ".claude/skills/claude-only-driver"), "claude-only-driver");
    skill(join(env.HOME, ".agents/skills/user-driver"), "user-driver");
    const target = join(root, "linked-source"); skill(target, "linked-driver");
    symlinkSync(target, join(project, ".agents/skills/linked-driver"), process.platform === "win32" ? "junction" : "dir");

    const retained = join(root, "retained-pin");
    cpSync(cached, retained, { recursive: true });
    const override = join(project, ".agents/skills/reflect-local");
    const copied = JSON.parse(execFileSync(process.execPath, [join(cached, "skills/reflect/scripts/copy-local-skill.mjs"), join(retained, "skills/reflect"), override], { env, cwd, encoding: "utf8", timeout: 10000 }));
    expect(copied.localName).toBe("reflect-local");
    const localBody = readFileSync(join(override, "SKILL.md"), "utf8");
    expect(localBody).toContain(`<${join(retained, "skills/poteto-mode/references/codex-tools.md")}>`);
    expect(readFileSync(join(override, "references/judgment-reviewer.md"), "utf8")).toContain(`<${join(retained, "skills/poteto-mode/references/project-skills.md")}>`);
    expect(readdirSync(join(project, ".agents/skills")).filter((name) => name === "poteto-mode")).toEqual([]);

    proc = spawn(binary, ["app-server", "--listen", "stdio://"], { env, cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8192); });
    proc.stdin.on("error", () => {});
    const client = rpc(proc, version);
    await client.request("initialize", { clientInfo: { name: "pstack-discovery-test", version: "1" } });
    client.initialized();
    const result = await client.request("skills/list", { cwds: [cwd], forceReload: true });
    const group = result.data.find((entry) => entry.cwd === cwd) ?? result.data[0];
    expect(group.errors ?? [], stderr).toEqual([]);
    const all = group.skills;
    const own = all.filter((entry) => entry.pluginId === "pstack@pstack-claude");
    const expected = readdirSync(join(plugin, "skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `pstack:${entry.name}`).sort();
    expect(own.map((entry) => entry.name).sort(), `Codex ${version}`).toEqual(expected);
    for (const entry of own) {
      expect(entry.enabled).toBe(true);
      expect(realpathSync(entry.path)).toBe(realpathSync(join(cached, "skills", entry.name.slice("pstack:".length), "SKILL.md")));
    }
    const local = all.filter((entry) => entry.name === "reflect-local");
    expect(local).toHaveLength(1);
    expect(local[0].enabled).toBe(true);
    expect(realpathSync(local[0].path)).toBe(realpathSync(join(override, "SKILL.md")));
    expect(local[0].pluginId ?? null).toBe(null);
    expect(all.filter((entry) => entry.name === "pstack:reflect")).toHaveLength(1);
    const names = all.map((entry) => entry.name);
    for (const name of ["root-driver", "package-driver", "user-driver", "linked-driver"]) expect(names).toContain(name);
    for (const name of ["claude-only-driver", "above-root-driver"]) expect(names).not.toContain(name);
    const collisions = all.filter((entry) => entry.name === "collision-driver");
    expect(new Set(collisions.map((entry) => realpathSync(entry.path))).size, `Codex ${version}: duplicate-name paths`).toBe(2);
    const hooks = await client.request("hooks/list", { cwds: [cwd] });
    expect(hooks.data.flatMap((entry) => entry.errors ?? [])).toEqual([]);
    const ownHooks = hooks.data.flatMap((entry) => entry.hooks).filter((entry) => entry.pluginId === "pstack@pstack-claude");
    expect(ownHooks.length).toBeGreaterThan(0);
    for (const hook of ownHooks) expect(hook.trustStatus).toBe("untrusted");
    console.log(`Codex ${version}: ${own.length} plugin skills, portable/ancestor/symlink paths and duplicate-name entries; hooks untrusted; distinct reflect-local selects the approved local path. No thread or turn started.`);
    await closeDiscovery(proc, root); proc = undefined;
    command("plugin", "remove", "pstack@pstack-claude", "--json");
    expect(existsSync(cached)).toBe(false);
    proc = spawn(binary, ["app-server", "--listen", "stdio://"], { env, cwd, stdio: ["pipe", "pipe", "pipe"] });
    proc.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8192); });
    proc.stdin.on("error", () => {});
    const resumed = rpc(proc, version);
    await resumed.request("initialize", { clientInfo: { name: "pstack-retained-source-test", version: "1" } });
    resumed.initialized();
    const refreshed = await resumed.request("skills/list", { cwds: [cwd], forceReload: true });
    const remaining = refreshed.data.find((entry) => entry.cwd === cwd) ?? refreshed.data[0];
    expect(remaining.errors ?? [], stderr).toEqual([]);
    const retainedLocal = remaining.skills.filter((entry) => entry.name === "reflect-local");
    expect(retainedLocal).toHaveLength(1);
    expect(realpathSync(retainedLocal[0].path)).toBe(realpathSync(join(override, "SKILL.md")));
    expect(remaining.skills.filter((entry) => entry.pluginId === "pstack@pstack-claude")).toEqual([]);
    expect(existsSync(join(retained, "skills/poteto-mode/references/codex-tools.md"))).toBe(true);
    expect(existsSync(join(retained, "skills/poteto-mode/references/project-skills.md"))).toBe(true);
    console.log(`Codex ${version}: retained local entry and dependencies survive fixture plugin/cache removal. No thread or turn started.`);
  } finally {
    await closeDiscovery(proc, root);
    rmSync(root, { recursive: true, force: true });
  }
}, 90000);
