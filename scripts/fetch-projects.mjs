#!/usr/bin/env node
// Pulls every public repo from GitHub and rewrites the data block inside
// projects.html.
//
//   node scripts/fetch-projects.mjs [username]
//
// Unauthenticated GitHub allows 60 requests/hour, which covers ~50 repos.
// Set GITHUB_TOKEN in the environment to raise that if you outgrow it.

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const USER = process.argv[2] || "aloniewski2";
const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const PAGE = join(ROOT, "projects.html");
const START = "/* PROJECTS:START */";
const END = "/* PROJECTS:END */";

const headers = {
  "user-agent": "portfolio-build",
  accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function api(url) {
  const res = await fetch(url, { headers });
  if (res.status === 403) throw new Error("GitHub rate limit reached — wait an hour or set GITHUB_TOKEN.");
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

async function text(url) {
  const res = await fetch(url, { headers: { "user-agent": "portfolio-build" } });
  return res.ok ? res.text() : null;
}

// A README's first real paragraph — but only if it actually says something.
// Scaffolding, bare links, and TODO comments are worse than saying nothing.
const JUNK = [
  /^this is a next\.js project/i,
  /^https?:\/\/\S+$/,
  /^\/\//,
  /^getting started/i,
  /^# /,
];

async function summarize(repo) {
  let raw = null;
  for (const file of ["README.md", "readme.md", "README.MD", "Readme.md"]) {
    raw = await text(`https://raw.githubusercontent.com/${USER}/${repo}/HEAD/${file}`);
    if (raw) break;
  }
  if (!raw) return null;

  const para = [];
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s) { if (para.length) break; continue; }
    if (/^(#|!|<|>|\||-{3,}|`{3}|\[!)/.test(s)) continue;
    if (/^[-*]\s/.test(s) && !para.length) continue;
    para.push(s);
    if (para.join(" ").length > 260) break;
  }

  let out = para.join(" ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")   // links -> their label
    .replace(/[*_`#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!out || out.length < 25 || JUNK.some((re) => re.test(out))) return null;
  return out.length > 230 ? out.slice(0, 230).replace(/\s+\S*$/, "") + "…" : out;
}

const trim = (s, n) => (!s ? null : s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s);

console.log(`Fetching repos for ${USER}…`);
const repos = await api(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`);
const projects = [];

for (const r of repos) {
  if (r.fork) continue;
  const langs = await api(r.languages_url).catch(() => ({}));
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v / total > 0.05)
    .slice(0, 4)
    .map(([k]) => k);

  // Prefer the GitHub description, except when it's a throwaway tagline — a
  // README's opening line explains the project to a stranger far better than
  // "put ur money where ur mouth is".
  const desc = trim(r.description, 230);
  const readme = await summarize(r.name);
  const blurb = !desc ? readme
    : (readme && desc.length < 70 && readme.length > desc.length) ? readme
    : desc;

  projects.push({
    name: r.name,
    blurb,
    langs: top,
    stars: r.stargazers_count,
    topics: r.topics || [],
    url: r.html_url,
    home: r.homepage || null,
    updated: r.updated_at.slice(0, 10),
    created: r.created_at.slice(0, 10),
    empty: r.size === 0,
  });
  console.log(`  ${r.name.padEnd(26)} ${top.join(", ") || "—"}${blurb ? "" : "   (no description)"}`);
}

const block = `${START}\nconst PROJECTS = ${JSON.stringify(projects, null, 1)};\n${END}`;
const page = await readFile(PAGE, "utf8");
const a = page.indexOf(START), b = page.indexOf(END);
if (a < 0 || b < 0) throw new Error(`Couldn't find ${START}/${END} markers in projects.html`);
await writeFile(PAGE, page.slice(0, a) + block + page.slice(b + END.length), "utf8");

// Keep the "N more on GitHub" line on the main page honest.
const FEATURED = ["subscription-saver", "solveit-ai-v1", "DineValley"];
const index = join(ROOT, "index.html");
const home = await readFile(index, "utf8").catch(() => null);
if (home) {
  const rest = projects.filter((p) => !FEATURED.includes(p.name)).length;
  const patched = home.replace(/(<b id="repoCount">)\d+(<\/b>)/, `$1${rest}$2`);
  if (patched !== home) await writeFile(index, patched, "utf8");
}

const bare = projects.filter((p) => !p.blurb).map((p) => p.name);
console.log(`\nWrote ${projects.length} projects into projects.html`);
if (bare.length) console.log(`Still missing a description on GitHub: ${bare.join(", ")}`);
