#!/usr/bin/env node
// Bundles knowledge/ into api/knowledge.js for the chat endpoint: top-level files
// as the core sent with every question, subfolder files as chunks it looks up.
//
//   node scripts/build-knowledge.mjs
//
// Drop anything you want the assistant to know into knowledge/ — Markdown notes,
// README files, source files from a repo — then re-run this and redeploy.
//
// It also adds the full public-repo catalogue from index.html (written there by
// scripts/fetch-projects.mjs), so the model knows every project, not only the
// three on the resume.

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

// Files directly in knowledge/ (resume.md, about.md, ...) are the core: sent with
// every question. Files in subfolders (projects/ from fetch-readmes.mjs) are cut
// into chunks the endpoint looks up per question, so a free-tier model's
// tokens-per-minute budget goes on the few passages that matter.
const sections = [];
const chunks = [];
let total = 0;
let skipped = 0;

// Every public repo, as one compact document.
try {
  const page = await readFile(join(ROOT, "index.html"), "utf8");
  const json = page.match(/<script type="application\/json" id="repo-data">([\s\S]*?)<\/script>/)?.[1];
  const repos = json ? JSON.parse(json) : [];
  if (repos.length) {
    const lines = repos.map((r) =>
      `- ${r.name}${r.blurb ? ` — ${r.blurb}` : ""}` +
      `${r.langs?.length ? ` [${r.langs.join(", ")}]` : ""}` +
      ` Code: ${r.url}${r.home ? ` Live: ${r.home}` : ""} (updated ${r.updated})`);
    const section =
      `<document path="github-projects (generated from index.html)">\n` +
      `All of Andrew's public GitHub repositories, newest first. More detail on a repo, ` +
      `when there is any, appears in the project documents below.\n\n${lines.join("\n")}\n</document>`;
    sections.push(section);
    total += section.length;
    console.log(`  core  github-projects (${repos.length} repos)`);
  }
} catch (err) {
  console.warn(`  skip  github-projects (${err.message})`);
}

const CHUNK_CHARS = 1400;

// Split on headings, then pack neighbouring sections up to CHUNK_CHARS. Every
// chunk keeps the file's header block (project name, links) so it stands alone.
function chunk(label, body) {
  const [head, ...rest] = body.split(/\n\s*\n/);
  const text = rest.join("\n\n");
  const pieces = text.split(/\n(?=#{1,3} )/).flatMap((sec) => {
    if (sec.length <= CHUNK_CHARS) return [sec];
    const out = [];
    let cur = "";
    for (const para of sec.split(/\n\s*\n/)) {
      if (cur && cur.length + para.length > CHUNK_CHARS) { out.push(cur); cur = ""; }
      cur += (cur ? "\n\n" : "") + para;
    }
    if (cur) out.push(cur);
    return out;
  });
  const packed = [];
  let cur = "";
  for (const p of pieces.map((x) => x.trim()).filter(Boolean)) {
    if (cur && cur.length + p.length > CHUNK_CHARS) { packed.push(cur); cur = ""; }
    cur += (cur ? "\n\n" : "") + p;
  }
  if (cur) packed.push(cur);
  if (!packed.length) packed.push("");
  return packed.map((p) => ({ path: label, text: `${head}\n\n${p}`.trim() }));
}

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

  if (label.includes("/")) {
    const parts = chunk(label, body);
    chunks.push(...parts);
    console.log(`  chunk ${label} (${parts.length})`);
    continue;
  }

  const section = `<document path="${label}">\n${body}\n</document>`;
  if (total + section.length > MAX_TOTAL_CHARS) {
    console.warn(`  skip  ${label} (total budget reached)`);
    skipped++;
    continue;
  }
  sections.push(section);
  total += section.length;
  console.log(`  core  ${label} (${(body.length / 1024).toFixed(1)}KB)`);
}

const knowledge = sections.join("\n\n");

await writeFile(
  OUT,
  "// GENERATED FILE — edit knowledge/ and run `npm run build:knowledge` instead.\n" +
  `// Core: ${sections.length} document(s), ${knowledge.length} characters. ` +
  `Lookup: ${chunks.length} chunk(s).\n` +
  `export const KNOWLEDGE = ${JSON.stringify(knowledge)};\n` +
  `export const CHUNKS = ${JSON.stringify(chunks)};\n`,
  "utf8"
);

console.log(
  `\nWrote ${relative(ROOT, OUT)} — core ${(knowledge.length / 1024).toFixed(1)}KB, ` +
  `${chunks.length} lookup chunks` + (skipped ? `, ${skipped} skipped` : "")
);
