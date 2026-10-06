#!/usr/bin/env node
// Saves the README of every public repo listed in index.html's repo-data block
// into knowledge/projects/, cleaned for a language model: no badges, images,
// HTML, or code blocks — just the prose and tables that say what was built.
//
//   node scripts/fetch-readmes.mjs
//
// Run scripts/fetch-projects.mjs first if the repo list is stale, then
// `npm run build:knowledge` and redeploy.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const USER = "aloniewski2";
const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT = join(ROOT, "knowledge", "projects");

const page = await readFile(join(ROOT, "index.html"), "utf8");
const repos = JSON.parse(page.match(/<script type="application\/json" id="repo-data">([\s\S]*?)<\/script>/)[1]);

async function readme(repo) {
  for (const file of ["README.md", "readme.md", "Readme.md", "README.MD"]) {
    const res = await fetch(`https://raw.githubusercontent.com/${USER}/${repo}/HEAD/${file}`);
    if (res.ok) return res.text();
  }
  return null;
}

// Sections about running the code rather than what it is. Dropped whole, heading
// to next heading of the same or higher level.
const NOISE = /^(welcome to your lovable project|project info|how can i |what technologies are used|can i connect|getting started|quick ?start|installation|prerequisites|requirements|running( it| tests| locally)?|setup|environment( variables| setup)?|configuration|development( notes)?|deploying|deployment|available scripts|troubleshooting|contributing|license|acknowledg|default ports|test reports|`)/i;

function dropNoise(md) {
  const out = [];
  let skipLevel = 0;
  for (const line of md.split("\n")) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const title = h[2].replace(/[^\p{L}\p{N}`' ]/gu, "").trim();
      if (skipLevel && level > skipLevel) continue;
      skipLevel = NOISE.test(title) ? level : 0;
      if (skipLevel) continue;
    } else if (skipLevel) continue;
    out.push(line);
  }
  return out.join("\n");
}

function clean(md) {
  // code blocks are setup commands, not facts
  return dropNoise(md.replace(/```[\s\S]*?```/g, ""))
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")                // images and badges
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/<[^>]+>/g, "")                            // inline HTML
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1 ($2)")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")             // relative links -> label
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")              // table separator rows
    .replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, "")       // horizontal rules
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

let saved = 0;
for (const r of repos) {
  const raw = await readme(r.name);
  const body = raw ? clean(raw) : "";
  const header = [
    `# Project: ${r.name}`,
    r.blurb && `Summary: ${r.blurb}`,
    `Code: ${r.url}`,
    r.home && `Live: ${r.home}`,
    r.langs?.length && `Languages: ${r.langs.join(", ")}`,
    `Last updated: ${r.updated}`,
  ].filter(Boolean).join("\n");
  if (!body && !r.blurb) {
    console.log(`  skip  ${r.name} (no README or description)`);
    continue;
  }
  await writeFile(join(OUT, `${r.name}.md`), `${header}\n\n${body}\n`, "utf8");
  console.log(`  save  ${r.name} (${(body.length / 1024).toFixed(1)}KB)`);
  saved++;
}
console.log(`\n${saved} project files in knowledge/projects/`);
