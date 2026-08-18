#!/usr/bin/env node
// Bundles everything in knowledge/ into api/knowledge.js so the chat endpoint can
// ship it as one cached system prompt.
//
//   node scripts/build-knowledge.mjs
//
// Drop anything you want the assistant to know into knowledge/ — Markdown notes,
// README files, source files from a repo — then re-run this and redeploy.

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "knowledge");
const OUT = join(ROOT, "api", "knowledge.js");

// Text formats worth feeding to a language model. Anything else is skipped.
const ALLOWED = new Set([
  ".md", ".markdown", ".txt", ".rst",
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".java", ".go", ".rb", ".rs", ".sql", ".sh",
  ".json", ".yml", ".yaml", ".toml", ".css", ".html",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out",
  "coverage", "__pycache__", ".venv", "venv", ".DS_Store",
]);

const MAX_FILE_BYTES = 120_000;   // a single huge file shouldn't crowd out everything else
const MAX_TOTAL_CHARS = 400_000;  // ~100k tokens; the endpoint trims further if needed

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return acc;
    throw err;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, acc);
    } else if (ALLOWED.has(extname(entry.name).toLowerCase())) {
      acc.push(full);
    }
  }
  return acc;
}

const files = await walk(SRC);

if (files.length === 0) {
  console.error(
    `No readable files under ${relative(ROOT, SRC)}/.\n` +
    `Add at least resume.md before building.`
  );
  process.exit(1);
}

const sections = [];
let total = 0;
let skipped = 0;

for (const file of files) {
  const info = await stat(file);
  const label = relative(SRC, file).split(sep).join("/");

  if (info.size > MAX_FILE_BYTES) {
    console.warn(`  skip  ${label} (${(info.size / 1024).toFixed(0)}KB > ${MAX_FILE_BYTES / 1024}KB)`);
    skipped++;
    continue;
  }

  const body = (await readFile(file, "utf8")).trim();
  if (!body) continue;

  const section = `<document path="${label}">\n${body}\n</document>`;
  if (total + section.length > MAX_TOTAL_CHARS) {
    console.warn(`  skip  ${label} (total budget reached)`);
    skipped++;
    continue;
  }

  sections.push(section);
  total += section.length;
  console.log(`  add   ${label} (${(body.length / 1024).toFixed(1)}KB)`);
}

const knowledge = sections.join("\n\n");

await writeFile(
  OUT,
  "// GENERATED FILE — edit knowledge/ and run `npm run build:knowledge` instead.\n" +
  `// ${sections.length} document(s), ${knowledge.length} characters.\n` +
  `export const KNOWLEDGE = ${JSON.stringify(knowledge)};\n`,
  "utf8"
);

console.log(
  `\nWrote ${relative(ROOT, OUT)} — ${sections.length} document(s), ` +
  `${(knowledge.length / 1024).toFixed(1)}KB` +
  (skipped ? `, ${skipped} skipped` : "")
);
