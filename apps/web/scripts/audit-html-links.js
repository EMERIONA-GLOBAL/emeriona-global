import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const htmlFiles = readdirSync(root, { recursive: true }).filter((name) => typeof name === "string" && name.endsWith(".html") && !name.includes("node_modules"));
let failures = 0;
for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), "utf8");
  const ids = [...source.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const idSet = new Set(ids);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const fragments = [...source.matchAll(/href=["']#([^"']+)["']/g)].map((match) => match[1]);
  const missing = [...new Set(fragments.filter((fragment) => !idSet.has(fragment)))];
  if (duplicateIds.length || missing.length) {
    failures++;
    console.error(`FAIL ${file}${duplicateIds.length ? " duplicate IDs: " + [...new Set(duplicateIds)].join(", ") : ""}${missing.length ? " missing fragment targets: " + missing.join(", ") : ""}`);
  } else {
    console.log(`PASS ${file} (${ids.length} IDs, ${fragments.length} fragment links)`);
  }
}
if (!htmlFiles.length) {
  console.error("No HTML files were audited.");
  process.exit(1);
}
if (failures) process.exit(1);
console.log(`HTML link-integrity audit passed for ${htmlFiles.length} file(s).`);
