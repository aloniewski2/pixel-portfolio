# Project: lifeAI
Summary: AI Legacy OS — a local-first archive of a life. Journals, stories, photos and voice stay on the device; exports an autobiography, a timeline and a self-contained memorial. On-device Whisper dictation and Kokoro speech.
Code: https://github.com/aloniewski2/lifeAI
Live: https://aloniewski2.github.io/lifeAI/
Languages: TypeScript
Last updated: 2026-08-20

# AI Legacy OS

> Everyone dies. Not everyone has to disappear.

AI Legacy OS quietly records a life over decades — journals, stories, values,
milestones, and eventually photos, voice, and conversations — and turns it
into things a family can keep: an autobiography, an interactive timeline,
messages delivered in the future, and a lasting memorial.

## Design

The UI follows the "Letterpress" system: sacred, family-facing surfaces
(landing, timeline, autobiography, memorial) live on warm paper; writing
surfaces (letters, the interview) live in a dark study; a single sealing-wax
red is the only accent. Serif is the system Charter/Georgia stack — no
webfonts. Tokens live in `tailwind.config.ts`, keyframes (wax seal, candle,
typewriter caret) in `src/index.css`; animations respect
`prefers-reduced-motion`.

## What's in this MVP

A local-first web app. The entire archive lives in the browser
(`localStorage`) — no account, no server, no data leaving the device unless
the owner exports it.

| Area | What it does today |

| Question of the day | A daily writing prompt from a curated bank — answering takes two minutes |
| Capture | Journals, stories, milestones, and values with dates and tags; dictation via on-device Whisper |
| Photo import | Batch-import photos, auto-placed on the timeline by their EXIF date; stored on-device (IndexedDB) |
| Calendar import | Drop in an .ics export; events become suggested milestones you review before keeping — recurring events collapse to one suggestion |
| Social import | Drop in an Instagram, Facebook, or X export (ZIP or single file); posts become suggested entries you review — retweets and duplicates dropped |
| Interviewer | The app's capture engine: archive-aware (it hunts timeline gaps, unexplored values, and thin stories), resumable across navigation, and stories save with the date they happened. Four engines: Guided (built-in, no AI), on-device Llama 3.2 (WebLLM), Ollama on localhost, or Claude (opt-in, bring-your-own key) |
| Ask | Ask the archive a question; answers are reconstructed only from recorded memories, with sources cited and a permanent simulation label |
| Timeline | The whole archive in chronological order, filterable by kind |
| Autobiography | Chapters auto-assembled by year from the owner's own words |
| Future messages | Sealed letters that unlock on a chosen date |
| Memorial | The family-facing archive: values, milestones, stories, photos — exportable as one self-contained HTML file that needs no app, no server, and no internet |
| Vault | Per-source consent switches, JSON export/import, permanent wipe |

### How capture stays fast

- Prompt of the day kills the blank page — one curated question, rotated
  deterministically by date.
- Voice dictation runs Whisper (`@huggingface/transformers`) entirely in
  the browser. The model ships with the app in `public/models/` — no runtime
  download — and audio never leaves the device. Gated behind the voice
  consent switch. (Workers intercept the libraries' hardcoded huggingface.co
  URLs and serve the vendored files; see `src/lib/localModels.ts`.)
- Photo import reads each photo's EXIF capture date client-side
  (`exifr`), downscales it, and stores it in IndexedDB — decades of timeline
  anchors from one multi-select. Gated behind the photos consent switch.
- Calendar import parses .ics exports on-device (`src/lib/ics.ts`, no
  dependency) into a review list: recurring events collapse to a single
  suggestion, already-archived events are filtered out, and only checked
  events become milestones. Gated behind the calendar consent switch.
- Social import reads Instagram, Facebook, and X exports on-device
  (`src/lib/social.ts`): unzips the download, finds the post files whatever
  they are named, repairs Meta's mangled accents, drops retweets and
  cross-posted duplicates, and offers the rest as a review list. Gated
  behind the social-media consent switch.
- The interviewer has four engines, three of them free and fully local:
  - Guided (default) — a curated opener plus the follow-up questions a
    good interviewer always asks; the saved story is the speaker's exact
    words, stitched verbatim. No AI, no download, works in every browser.
  - On-device AI — Llama 3.2 1B running in the browser via
    WebLLM (https://github.com/mlc-ai/web-llm) (Apache-2.0) on WebGPU.
    ~880MB one-time download, cached; then it works offline.
  - Ollama — talks to a local Ollama (https://ollama.com) server at
    `localhost:11434` (start it with
    `OLLAMA_ORIGINS= ollama serve`). Best local quality.
  - Claude — the optional cloud tier (`claude-haiku-4-5`, user's own
    key stored outside the archive so exports never contain it). The only
    engine where words leave the device, so it alone sits behind the
    conversations consent switch.
- Prepare this device (Vault) downloads every on-device model in one
  tap — narration voice, dictation, and the interviewer — so nothing has to
  download mid-conversation and everything keeps working offline. Sequential
  downloads, per-model progress, already-cached models are skipped.

## Product principles

1. Local-first. Data stays on-device by default. Sync, when it comes, is
   end-to-end encrypted and opt-in.
2. Consent per source. Every input (photos, voice, conversations,
   calendar, social media, email) has its own switch, off by default. The
   switches ship before the features so consent is designed in, not bolted on.
3. A simulation, not a person. Anything generated from the archive — the
   future "ask them a question" AI included — is permanently labeled as a
   reconstruction drawn from the person's own words.
4. Yours to delete. One action wipes everything, with no server copy to
   linger.
5. Outlives the app. The memorial exports as a single HTML file with the
   photos inlined (`src/lib/memorialExport.ts`) — no scripts, no network
   requests, no dependency on this project still existing. Family can email
   it, print it, or keep it on a drive.

## Roadmap

- AI editing pass that polishes autobiography prose without inventing facts
- Delivery of future messages to recipients (email / family accounts)
- Family archive with per-person access (the memorial already exports as a standalone keepsake file)
- Conversational "ask them a question" mode over the archive, clearly
  labeled as a simulation
- End-to-end encrypted sync and family inheritance/executor flow
- Keeping original voice recordings alongside transcripts
