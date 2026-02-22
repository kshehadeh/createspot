/**
 * Patches the generated Prisma client to remove the globalThis["__dirname"] line.
 * That line causes Playwright to mis-detect the module as CommonJS when loading
 * global-setup, leading to "ReferenceError: exports is not defined in ES module scope".
 * See: https://github.com/prisma/prisma/issues/28838
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const clientPath = join(
  import.meta.dirname,
  "..",
  "app",
  "generated",
  "prisma",
  "client.ts",
);
let content = readFileSync(clientPath, "utf-8");
// Prisma may generate with single or double quotes, with or without semicolon
const dirnameLine =
  /^\s*globalThis\[['"]__dirname['"]\]\s*=\s*path\.dirname\(fileURLToPath\(import\.meta\.url\)\)\s*;?\s*$/m;
if (dirnameLine.test(content)) {
  content = content.replace(
    dirnameLine,
    "// Patched for Playwright ESM: __dirname polyfill removed (see scripts/patch-prisma-client.ts)\n",
  );
  writeFileSync(clientPath, content);
  console.log("[patch-prisma-client] Patched client.ts for Playwright ESM");
} else {
  console.warn(
    "[patch-prisma-client] Expected line not found; client may already be patched or Prisma output changed.",
  );
}
