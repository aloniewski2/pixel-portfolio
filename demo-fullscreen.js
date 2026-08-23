/* Fullscreen demo host — shared by the landing page and the projects page.
 *
 * Both pages used to embed a 1280x800 app scaled to roughly a third inside a
 * card. On the landing page it was interactive only while the pointer stayed
 * inside the card; on the projects page `pointer-events:none` was never lifted,
 * so a loaded demo could not be touched at all. Neither was a usable size.
 *
 * So interaction moved out of the card: a card holds a preview, and playing a
 * demo opens it full size over the page with one close control that is in the
 * same corner every time.
 *
 * Self-contained on purpose. It injects its own styles and markup so a page
 * only has to call openDemo(), and there is one copy of this behaviour rather
 * than one per page drifting apart.
 */
(() => {
  if (window.openDemo) return;

  const CSS = `
.fs{position:fixed;inset:0;z-index:200;display:none;flex-direction:column;background:var(--ink,#191a2c)}
.fs.open{display:flex}
.fs-bar{flex:none;display:flex;align-items:center;gap:10px;padding:10px 12px;
  background:var(--panel,#fffaef);border-bottom:4px solid var(--line,#191a2c)}
.fs-title{flex:1;min-width:0;font-size:14px;font-weight:bold;letter-spacing:.12em;
  text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fs-bar .btn{padding:7px 12px;font-size:12px;box-shadow:4px 4px 0 var(--line,#191a2c)}
/* Square, so it reads as a pixel button rather than a stray letter, and always
   last on the bar — the one control a visitor must find without looking. */
.fs-x{flex:none;width:38px;height:38px;padding:0;justify-content:center;
  background:var(--accent,#ff6f4a);color:#fff;font-size:17px;letter-spacing:0}
.fs-stage{flex:1;position:relative;min-height:0;background:#fff}
.fs-stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.fs-load{position:absolute;inset:0;display:grid;place-items:center;background:#0f1526;
  color:#7f8db0;font-size:12px;letter-spacing:.14em;text-transform:uppercase}
body.fs-locked{overflow:hidden}
@media (max-width:640px){
  .fs-bar{padding:8px}
  .fs-title{font-size:12px;letter-spacing:.08em}
}`;

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);

  const fs = document.createElement("div");
  fs.className = "fs";
  fs.id = "fs";
  fs.hidden = true;
  fs.setAttribute("role", "dialog");
  fs.setAttribute("aria-modal", "true");
  fs.setAttribute("aria-label", "Live demo");
  fs.innerHTML =
    `<div class="fs-bar">` +
      `<span class="fs-title"></span>` +
      `<a class="btn fs-open" target="_blank" rel="noopener">Open ↗</a>` +
      `<button class="btn fs-x" type="button" aria-label="Close demo" title="Close (Esc)">✕</button>` +
    `</div>` +
    `<div class="fs-stage"></div>`;

  const mount = () => document.body.append(fs);
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount, { once: true });

  const title = fs.querySelector(".fs-title");
  const openLink = fs.querySelector(".fs-open");
  const closeBtn = fs.querySelector(".fs-x");
  const stage = fs.querySelector(".fs-stage");
  let lastFocus = null;

  window.openDemo = function openDemo({ src, label, trigger }) {
    if (!src) return;
    lastFocus = trigger || document.activeElement;
    title.textContent = label || "Live demo";
    fs.setAttribute("aria-label", `${label || "Live"} demo`);
    openLink.href = src;

    const load = document.createElement("div");
    load.className = "fs-load";
    load.textContent = "loading demo…";
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = `${label || "Live"} demo`;
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-forms");
    frame.addEventListener("load", () => load.remove(), { once: true });
    stage.replaceChildren(load, frame);

    fs.hidden = false;
    fs.classList.add("open");
    document.body.classList.add("fs-locked");
    closeBtn.focus();
  };

  window.closeDemo = function closeDemo() {
    if (!fs.classList.contains("open")) return;
    fs.classList.remove("open");
    fs.hidden = true;
    document.body.classList.remove("fs-locked");
    // Tear the frame down rather than hide it: a mounted third-party app keeps
    // running — audio, timers, polling — behind a page you have already left.
    stage.replaceChildren();
    lastFocus?.focus();
  };

  closeBtn.addEventListener("click", window.closeDemo);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.closeDemo(); });

  /* Only two focusables in here, so a full trap is overkill — but focus must
     not wander behind the overlay while it is up. */
  fs.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const stops = [openLink, closeBtn];
    const i = stops.indexOf(document.activeElement);
    if (i === -1) { e.preventDefault(); closeBtn.focus(); return; }
    const next = e.shiftKey ? i - 1 : i + 1;
    if (next < 0 || next >= stops.length) {
      e.preventDefault();
      stops[e.shiftKey ? stops.length - 1 : 0].focus();
    }
  });
})();
