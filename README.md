# Pixel Sky Portfolio — Andrew Loniewski

A pixel-art portfolio with a resume assistant that answers instantly for every visitor —
no API key, no account, no server, no cost.

- `index.html` — the whole site: markup, styles, pixel-art engine, bitmap font, and the
  assistant. No build step, no dependencies, no external requests.
- `projects.html` — every public GitHub repo, with language filters. Linked from the
  **View all projects** button under the three featured write-ups.
- `scripts/fetch-projects.mjs` — refreshes that page from the GitHub API.
- `knowledge/` + `scripts/build-knowledge.mjs` + `api/chat.js` — **optional**, only needed if you
  later want a real language model answering on the deployed site. See "Upgrading" below.

## The idea

The whole page sits on a live pixel-art sky rendered to a canvas at ~1/5 resolution and scaled up
with `image-rendering: pixelated`, so every gradient band, cloud, and tree is a real chunky pixel.

**Scrolling advances the time of day.** Top of the page is morning; by the contact section the sun
has set through golden hour and dusk and the stars are out. The sky, sun/moon arc, cloud shading,
hills, and birds all interpolate from the same five keyframed palettes.

The intro sits directly in that sky — no card, no panel. **The name is towed in by a plane.** A
pixel biplane flies in on load hauling a cloth banner that carries "ANDREW LONIEWSKI" in the same
5×7 bitmap font as everything else; it settles into place and holds station with a gentle bob. The
banner is redrawn column by column every frame against a travelling sine, so the cloth ripples the
way a real aerial banner does, and the tow rope sags and snaps on the same wave. The swallow tail
sits on the free end, trailing away from the plane.

As the sky turns, so does the rig. Between roughly 80% and 95% of the way down the page — dusk into
night — the biplane hands the name over to a **flying saucer**, crossfaded so it reads as a
transformation rather than a pop. The cloth banner becomes a hologram: dark plate, neon-green frame
and lettering, scanlines, and a slight flicker; the billowing ripple drops to a tremble, because a
hologram doesn't catch the wind. The tow rope becomes a pulsing beam of light, and the saucer's
running lights chase around its rim.

The rig is deliberately restrained — about 40% of the viewport at desktop — so the scenery carries
the page rather than the title. It paints once at its resting position the moment it's built, so a
throttled or backgrounded tab never shows a page with no heading, and the real `<h1>` is live text
for screen readers with the canvas marked `aria-hidden`.

Body copy is set in a real monospace face (`ui-monospace` / SF Mono / Menlo) rather than Courier
New, which is thin and muddy at small sizes, and text sitting directly on the sky carries a
two-pixel cream halo so it stays readable at every point in the day cycle.

## Things to try

- **Click the bird** — bottom-right, always on screen. It opens the assistant.
- **Scroll** — the sun arcs and the palette shifts. The nav chip shows the current time of day.
- **Click the nav chip** — cycles `AUTO → DAY → GOLDEN HOUR → NIGHT` to pin the sky.
- **Click anywhere on the sky** — spawns a cloud that drifts away.

---

## The bird

The assistant has a body: a pixel bluebird fixed to the bottom-right corner that stays with you
the whole way down the page. It's drawn at 26×22 logical pixels and scaled up by CSS, so it's made
of the same chunky pixels as the sky it flies over — bobbing, flapping, blinking every few seconds,
and flapping harder for a moment after it finishes an answer.

Clicking it opens the assistant in a floating dock anchored above it; clicking again, the ✕, or
Escape closes it. The same bird animates live in the dock's header as the assistant's avatar —
one sprite, drawn once per frame and copied into both canvases.

The dock itself is a light chat surface rather than a terminal: right-aligned ink bubbles for the
visitor, cream bordered bubbles for answers, quiet centred system lines, a one-row scrollable strip
of suggested questions, and a pulsing-dot typing indicator. Speaker is carried by alignment and
colour, with the labels kept in the accessibility tree for screen readers. The nav's **ASK** button and the hero's **Ask my resume** button open the same
dock, so it's discoverable without relying on someone noticing a bird. Four seconds after load a
small speech bubble nudges first-time visitors once, then gets out of the way for good.

Focus moves into the input on open and back to the bird on close, and the bird carries a real
`aria-expanded` / `aria-controls` pair, so it works from the keyboard.

## The resume assistant

It runs **entirely in the visitor's browser**, reading the resume already rendered on the page.
Nothing to install, nothing to sign into, nothing sent anywhere, and no cost to you at any traffic
level. First question is answered in milliseconds.

It is a retrieval and answer-composition engine, not a language model — and it says so when asked
"are you an AI?".

**It answers like a chatbot, not like a résumé.** Replies are written as short natural sentences
and delivered as *separate messages*, one at a time, with a typing indicator and a pause between
them — the way a person actually types. Résumé bullets are condensed to their headline clause on
the way out, so nothing arrives as a wall of formal prose:

> **you** — what has he shipped at noteefy
> **bird** — He's a Junior Software Engineer at Noteefy since May 2026 — mostly React, TypeScript, Python.
> **bird** — Biggest piece: shipped a refund tracking dashboard end to end.
> **bird** — Drove a multi-quarter admin dashboard consolidation.
> **bird** — There's more where that came from.
>
> **you** — tell me more
> **bird** — Closed 100+ Linear issues in three months across feature development, third-party API integrations, production debugging, and customer escalations.

| Capability | Example |
| --- | --- |
| Conversational memory | *"tell me more"* / *"what was the stack?"* resolve against whatever you just asked about, and it won't repeat a detail it already gave you |
| Contextual follow-ups | the chip row rewrites itself after every answer to fit the current topic |
| Small talk | greetings, thanks, "ok", goodbyes — short human replies, not résumé dumps |
| Intent handling | *"why should I hire him"* → a four-message pitch built from his metrics |
| Skill lookup with evidence | *"does he know Python?"* → "Yes, Python's on his stack", then the project where it actually shows up |
| Honest gaps | *"has he used Redis?"* → listed on the résumé, but no project calls it out |
| Off-limits questions | *"expected salary?"* → declines and points to email |
| Synonym expansion | *js → JavaScript*, *quant → quantitative*, *uni → college*, ~50 more |
| Word-boundary matching | so "go" doesn't match "al**go**rithms" |

Phrasing varies between runs (several openers per answer type), so asking the same thing twice
doesn't produce a copy-paste reply.

Because it reads the DOM, **the answers can never drift from the page**. Edit a bullet in
`index.html` and the assistant knows the new version immediately — there is no second copy of your
resume to maintain.

### Tuning it

Everything lives in section 7 of the `<script>` in `index.html`:

- `ALIASES` — shorthand visitors type, mapped onto resume vocabulary.
- `INTENTS` / `SMALL_TALK` — question patterns with hand-written replies, each returning an array
  of messages. Add one whenever you find a question you want answered a specific way; checked in
  order, first match wins.
- `speakJob` / `speakProject` / `speakSkill` — the sentence templates. Change the voice here.
- `condense()` — how a résumé bullet gets shortened into something worth saying out loud.
- `followUps()` — the chips offered after each answer.
- `buildIndex()` — which parts of the page become searchable.
- `PLUME` / `drawCompanion()` — the bird's colours and its sprite, if you'd rather it were a
  different creature.

---

## Upgrading to a real language model (optional)

The catch with in-browser answering is that it retrieves and composes rather than reasoning, so it
can't handle a question phrased in a way you didn't anticipate. If you want that, something has to
run a model — and the three constraints (instant · nothing on the visitor's end · free) can only
all hold if *you* supply the model, not the visitor.

The cheapest way is a **free-tier key held server-side**. Free tiers with no credit card required
include Groq, Google Gemini, Cerebras, and OpenRouter's `:free` models. Then:

```bash
npm run build:knowledge          # bundles knowledge/ into api/knowledge.js
vercel                           # deploys the page + api/chat.js
vercel env add LLM_BASE_URL      # e.g. https://api.groq.com/openai/v1
vercel env add LLM_MODEL         # e.g. llama-3.3-70b-versatile
vercel env add LLM_API_KEY       # the free key
```

`api/chat.js` speaks the OpenAI-compatible chat-completions dialect, so any of those providers
works with only env vars changed — and so do Ollama, LM Studio, llama.cpp, and vLLM. It has no
dependencies.

**The frontend needs no changes.** On load it quietly probes `/api/chat`; if a proxy answers, the
terminal switches to it and the header chip reads "Hosted model". If not, the built-in engine
handles everything as before. A model that dies mid-answer falls back automatically.

**Local development with Ollama:** if you're browsing from `http://localhost` and Ollama is
running, the page finds it and uses it — no config, no key. Ollama accepts browser requests from
localhost origins by default.

```bash
ollama pull llama3.2
npm start                        # serves this folder on http://localhost:8000
```

The header chip will read `Ollama · llama3.2`. This only ever applies to you on localhost; visitors
to the deployed site are never asked to install anything.

### `knowledge/`

Only used by the optional proxy. Drop in anything you want a model to know — project write-ups, a
longer bio, README files, source copied out of a repo — and run `npm run build:knowledge`. It
picks up text and code formats, skips `node_modules`/`.git`/binaries, caps single files at 120KB
and the whole corpus at 400KB.

---

## Deploying

It's a static site. Anything works — Netlify, GitHub Pages, Cloudflare Pages, Vercel:

```bash
npm start        # local preview at http://localhost:8000
```

Push the folder to a repo and point any static host at it. The assistant works on all of them,
because it never leaves the browser.

## The projects page

`projects.html` lists every public repo on `github.com/aloniewski2`, newest first, with
client-side filters by language. Refresh it whenever you push something new:

```bash
node scripts/fetch-projects.mjs
```

That re-reads the GitHub API, rewrites the data block in `projects.html`, and updates the
"N more on GitHub" count on the main page. Unauthenticated GitHub allows 60 requests an hour,
which covers about 50 repos; set `GITHUB_TOKEN` if you outgrow it.

For each repo it prefers the GitHub description, but falls back to the README's opening
paragraph when the description is missing or is a throwaway tagline — and prints a list of repos
that still have neither, so you know what to go fix.

## Before you publish

**LinkedIn URL** — two `TODO` comments in `index.html` point at
`https://www.linkedin.com/in/YOUR-HANDLE`. Replace both.

**LeakGuard's repo is missing.** `github.com/aloniewski2/subscription-saver` (the URL on your
résumé) returns 404 — it's either private or was never pushed. The card on the main page now says
"source not public yet" instead of linking to a dead page; restore the button once the repo is
public. There's a commented-out version of it in `index.html` ready to uncomment.

## Structure of `index.html`

| Region | What it does |
| --- | --- |
| `<style>` | Design tokens, pixel chrome (hard borders + offset shadows), terminal, layout |
| JS §1 | 5×7 bitmap font — hand-coded glyphs rendered to canvas, with outline + drop shadow |
| JS §2 | Day-cycle palettes (morning → midday → golden hour → dusk → night) |
| JS §3 | Sky engine: dithered bands, cloud sprites, sun/moon, birds, balloon, hills, foreground haze |
| JS §4–5 | Time-of-day chip, click-to-spawn-cloud |
| JS §6 | Hand-drawn 32×32 project sprites |
| JS §7 | The assistant — index, query understanding, answer composition, optional model backends |
| JS §7e | The bird — sprite, animation, and the dock it opens |
| JS §8 | Scroll reveals, stat counters, GPA meter, nav highlighting |

## Notes

- Zero external requests: no CDN, no webfonts, no analytics, no trackers.
- `prefers-reduced-motion` is respected — clouds, birds, counters, and the typing effect all stop.
- The sky is deliberately single-theme (it *is* the theme); the night palette is reached by
  scrolling rather than by a dark-mode toggle.
