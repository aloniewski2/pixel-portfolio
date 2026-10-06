# Project: legacy-os
Summary: A desktop operating system that runs in a browser tab — window manager, taskbar, terminal, Snake and Paint, in one dependency-free HTML file.
Code: https://github.com/aloniewski2/legacy-os
Live: https://aloniewski2.github.io/legacy-os/
Languages: HTML
Last updated: 2026-08-19

# Legacy OS

A desktop environment that runs in a browser tab. Boot sequence, draggable
windows, a taskbar, a start menu, and a handful of apps that actually work.

Try it → (https://aloniewski2.github.io/legacy-os/)

## What's in it

| App | What it does |

| Terminal | A real shell — `help`, `whoami`, `projects`, `neofetch`, `ls`, `cat`, `open `, `clear`, with command history on the arrow keys |
| Snake | Playable, keeps a high score |
| Paint | Canvas drawing, colour and brush sizes |
| Notepad | Saves what you type and still has it when you reopen |
| Projects | Live links to everything else I've built |
| About Me | The short version |

## How it's built

One HTML file. No framework, no dependencies, no build step, no external
requests — the whole thing is about 800 lines of hand-written HTML, CSS and
JavaScript.

The pieces worth pointing at:

- Window manager — z-order focus, drag by title bar, resize from the corner
  grip, minimise to the taskbar, double-click to maximise, and a cascade that
  refuses to place a window off-screen.
- Pointer events throughout, so dragging and resizing work identically with
  a mouse, a trackpad and a finger.
- The 3D bevel is two CSS classes. Every raised or sunken edge in the UI —
  buttons, panels, title bars, the taskbar — is one of them.
- Icons are inline SVG drawn on a 16px grid, so they stay crisp scaled up.
- Storage is wrapped. `localStorage` throws outright in some contexts
  (`data:` URLs, sandboxed frames, certain private modes). Everything it holds
  here is a nicety, so it falls back to memory rather than failing to boot.
