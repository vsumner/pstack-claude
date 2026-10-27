#!/usr/bin/env node
// Copy one approved skill, not a discovery tree. Keep sibling dependencies
// bound to their exact source paths; no registration, hooks or dependency setup.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const inside = (root, path) => {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
};

function filesIn(directory) {
  return readdirSync(directory).sort().flatMap((name) => {
    const path = join(directory, name), stat = lstatSync(path);
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) throw new Error(`Unsupported skill entry: ${path}`);
    return stat.isDirectory() ? filesIn(path) : [path];
  });
}

function preserveLinks(text, file, source) {
  const relocate = (raw) => {
    const angled = raw.startsWith("<");
    const value = angled ? raw.slice(1, -1) : raw.replace(/\\(.)/g, "$1");
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#|~)/i.test(value)) return raw;
    const hash = value.indexOf("#"), path = hash < 0 ? value : value.slice(0, hash);
    if (!path) return raw;
    const target = resolve(dirname(file), decodeURIComponent(path));
    if (!existsSync(target)) throw new Error(`Missing source dependency in ${file}: ${value}`);
    if (inside(source, target)) return raw;
    // Angle brackets preserve spaces and parentheses in the pinned path.
    if (/[<>\r\n]/.test(target)) throw new Error(`Unsupported dependency path: ${target}`);
    return `<${target.split(sep).join("/").replaceAll("%", "%25").replaceAll("#", "%23").replaceAll("?", "%3F")}${hash < 0 ? "" : value.slice(hash)}>`;
  };
  return text
    .replace(/(\]\([ \t]*)(<[^<>\r\n]*>|(?:\\.|[^\s)\r\n])+)([^)\r\n]*\))/g,
      (_, before, target, after) => before + relocate(target) + after)
    .replace(/^(\s{0,3}\[(?!\^)[^\]\n]+\]:[ \t]*)(<[^<>\r\n]*>|(?:\\.|[^\s\r\n])+)(.*)$/gm,
      (_, before, target, after) => before + relocate(target) + after);
}

export function copyLocalSkill(sourcePath, destinationPath) {
  const source = realpathSync(sourcePath), destination = resolve(destinationPath);
  const name = basename(destination);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) throw new Error("Destination must end in a valid skill name (at most 64 characters).");
  // Resolve the existing parent before checking containment, including symlinks.
  const parent = realpathSync(dirname(destination));
  const actualDestination = join(parent, name);
  const packageRoot = basename(dirname(source)) === "skills" ? dirname(dirname(source)) : source;
  if (inside(packageRoot, actualDestination)) throw new Error("Local destination must be outside the source package.");
  if (lstatSync(actualDestination, { throwIfNoEntry: false })) {
    throw new Error(`Destination already exists; maintain it in place: ${destination}`);
  }
  const skill = readFileSync(join(source, "SKILL.md"), "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill);
  const original = frontmatter && /^name:[ \t]*([a-z0-9-]+)[ \t]*$/m.exec(frontmatter[1]);
  if (!original) throw new Error("Source must have plain name frontmatter.");
  if (name === original[1]) throw new Error("Choose a distinct local skill name; do not rely on duplicate-name precedence.");
  if (existsSync(join(source, ".pstack-source.json"))) throw new Error("Maintain the existing local copy in place instead of copying it again.");

  const hash = createHash("sha256");
  const files = filesIn(source).map((file) => {
    const path = relative(source, file), bytes = readFileSync(file);
    hash.update(path.split(sep).join("/")).update("\0").update(bytes).update("\0");
    let contents = bytes;
    if (file.endsWith(".md")) {
      let text = preserveLinks(bytes.toString("utf8"), file, source);
      if (path === "SKILL.md") text = text.replace(/^name:[ \t]*[a-z0-9-]+[ \t]*$/m, `name: ${name}`);
      contents = Buffer.from(text);
    }
    return { path, contents, mode: lstatSync(file).mode & 0o777 };
  });
  // All dependencies and files are checked before creating the new destination.
  mkdirSync(actualDestination);
  for (const { path, contents, mode } of files) {
    const target = join(actualDestination, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, contents, { flag: "wx", mode });
  }
  const origin = { source, sourceSha256: hash.digest("hex"), sourceName: original[1], localName: name };
  writeFileSync(join(actualDestination, ".pstack-source.json"), JSON.stringify(origin, null, 2) + "\n", { flag: "wx" });
  return { path: join(actualDestination, "SKILL.md"), ...origin };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4) throw new Error("Usage: node copy-local-skill.mjs <source-skill-directory> <new-local-skill-directory>");
    console.log(JSON.stringify(copyLocalSkill(process.argv[2], process.argv[3])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
