# Local skill overrides

Installed packages and host caches stay immutable. After the user approves a local edit, inspect the existing destination through [project skill locations](project-skills.md). Maintain an existing compatible local copy in place. For a bundled source, copy only the selected skill with the packaged copier; a plain folder copy loses sibling references, including references inside reviewer templates.

Resolve `<plugin>` to the exact installed directory containing `skills/`, not a moving checkout or guessed cache path. Use an already retained exact source pin when available. A host-managed cache may disappear on update, so otherwise retain the complete plugin payload at an approved durable path outside every discovery root, named for the full source commit. Do not overwrite a retained tree; verify it matches before using it. Create the approved retained parent directory first, outside the source and discovery roots. No credentials or sessions belong in this copy.

```sh
# pstack-retain-plugin
set -eu
: "${SOURCE_PLUGIN:?Set the exact installed plugin directory}"
: "${RETAINED_PLUGIN:?Set the approved absolute retained directory}"
case "$RETAINED_PLUGIN" in /*) ;; *) echo 'Retained source must be absolute' >&2; exit 1;; esac
SOURCE_PLUGIN=$(cd "$SOURCE_PLUGIN" && pwd -P)
RETAINED_PARENT=$(cd "$(dirname "$RETAINED_PLUGIN")" && pwd -P)
RETAINED_PLUGIN="$RETAINED_PARENT/$(basename "$RETAINED_PLUGIN")"
case "$RETAINED_PLUGIN" in "$SOURCE_PLUGIN"|"$SOURCE_PLUGIN"/*) echo 'Retained copy must be outside the installed source' >&2; exit 1;; esac
if test -e "$RETAINED_PLUGIN" || test -L "$RETAINED_PLUGIN"; then
  echo 'Retained destination exists; verify it separately without overwriting' >&2
  exit 1
fi
cp -R "$SOURCE_PLUGIN" "$RETAINED_PLUGIN"
diff -qr "$SOURCE_PLUGIN" "$RETAINED_PLUGIN"
```

Choose a distinct approved name, such as `reflect-local`, and create its host-supported parent directory first:

```sh
node <retained-plugin>/skills/reflect/scripts/copy-local-skill.mjs \
  <retained-plugin>/skills/reflect <project-skills>/reflect-local
```

The copier refuses an existing destination, a duplicate of the source name, symlinked source contents and a destination inside the source package. It preserves internal links and binds external relative Markdown links to the retained exact source, including nested templates. It copies no sibling skill folders. `.pstack-source.json` records the source directory, source-skill hash and names. Retain that source tree while this copy depends on it; upgrading pstack does not silently rebase a local override. Review and approve dependency rebinding separately.

Review prose commands and script imports as well as Markdown links. The copier does not rewrite executable code or infer its dependencies; a skill needing sibling module imports requires the intact writable package layout described in [helper prerequisites](helper-prerequisites.md). Preserve source attribution and licensing when distributing adaptations.

Check every required dependency from the resulting copy, including reviewer templates, then apply only approved edits. Pi uses `/skill:reflect-local`; Codex uses the `$` picker entry `reflect-local`, checking its actual path rather than selecting bundled `pstack:reflect`. Original command names in copied prose still refer to the original entry unless deliberately updated. Do not change the user's implicit-selection preferences.

Verify the selected path through the native host catalog. Pi's first-wins collisions and Codex's separate duplicate entries are not portable override mechanisms. A catalog check proves selection metadata, not model compliance. Do not register the complete source tree, copy sibling skills into discovery, change project trust or enable hooks.
