#!/usr/bin/env python3
"""Generates og.png — the 1200x630 card shown when the site's URL is shared.

Drawn with the same 5x7 bitmap font and sky palette as the page itself, so the
preview looks like the site rather than a generic card. The font is read out of
index.html so the two can never drift apart. Pure stdlib: hand-rolled PNG.
"""
import ast, re, struct, zlib
from pathlib import Path

W, H = 1200, 630
ROOT = Path(__file__).resolve().parent.parent

# --- pull the glyph table straight out of the page
src = (ROOT / "index.html").read_text()
block = re.search(r"const F = \{(.*?)\n\};", src, re.S).group(1)
FONT = ast.literal_eval("{" + block + "}")

px = [[(0, 0, 0)] * W for _ in range(H)]

def rect(x, y, w, h, c):
    for yy in range(max(0, y), min(H, y + h)):
        row = px[yy]
        for xx in range(max(0, x), min(W, x + w)):
            row[xx] = c

def disc(cx, cy, r, c):
    for yy in range(max(0, cy - r), min(H, cy + r + 1)):
        dx = int((r * r - (yy - cy) ** 2) ** 0.5) if abs(yy - cy) <= r else 0
        rect(cx - dx, yy, dx * 2 + 1, 1, c)

def text(s, x, y, scale, c):
    for i, ch in enumerate(s.upper()):
        gl = FONT.get(ch, FONT[" "])
        for r in range(7):
            for k in range(5):
                if gl[r][k] == "#":
                    rect(x + (i * 6 + k) * scale, y + r * scale, scale, scale, c)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# sky, in dithered bands like the live page
TOP, MID, BOT = (0x3F, 0xA9, 0xE8), (0x8F, 0xD8, 0xF6), (0xFF, 0xE6, 0xB5)
BANDS = 22
for b in range(BANDS):
    t = (b + 0.5) / BANDS
    col = lerp(TOP, MID, t * 2) if t < 0.5 else lerp(MID, BOT, (t - 0.5) * 2)
    y0, y1 = H * b // BANDS, H * (b + 1) // BANDS
    rect(0, y0, W, y1 - y0, col)
    if b:                                   # dither the seam
        prev = lerp(TOP, MID, ((b - 0.5) / BANDS) * 2) if (b - 0.5) / BANDS < 0.5 else lerp(MID, BOT, (((b - 0.5) / BANDS) - 0.5) * 2)
        for x in range(0, W, 12):
            rect(x, y0 - 6, 6, 6, col)
            rect(x + 6, y0, 6, 6, prev)

disc(140, 150, 78, (0xFF, 0xF0, 0xA8))      # sun
disc(140, 150, 62, (0xFF, 0xD9, 0x4A))

# kept clear of the text block: top band and the strip above the hills only
for cx, cy, s in ((820, 95, 8), (995, 150, 5), (690, 520, 5), (170, 545, 4)):
    for i, (ox, r) in enumerate(((0, 5), (7, 7), (15, 5), (22, 4))):
        disc(cx + ox * s, cy, r * s, (0xFF, 0xFF, 0xFF))
    rect(cx - 2 * s, cy, 30 * s, 6 * s, (0xFF, 0xFF, 0xFF))
    rect(cx - 2 * s, cy + 5 * s, 30 * s, s, (0xDC, 0xEF, 0xFF))

rect(0, 545, W, 85, (0x7C, 0xC2, 0x6A))     # hills
rect(0, 585, W, 45, (0x4F, 0x9E, 0x4C))

# banner + name, mirroring the hero rig
INK, CLOTH, CORAL = (0x19, 0x1A, 0x2C), (0xFF, 0xFA, 0xEF), (0xFF, 0x6F, 0x4A)
S, NAME = 9, "ANDREW LONIEWSKI"
bw, bh = (len(NAME) * 6 - 1 + 6) * S, 11 * S
bx, by = 80, 250
rect(bx, by, bw, bh, CLOTH)
rect(bx, by, bw, S, INK)
rect(bx, by + bh - S, bw, S, INK)
rect(bx + bw - S, by, S, bh, INK)
rect(bx + bw - 2 * S, by + S, S, bh - 2 * S, CORAL)
text(NAME, bx + 3 * S, by + 2 * S, S, INK)

text("SOFTWARE ENGINEER", 80, 190, 5, INK)
text("REACT  TYPESCRIPT  PYTHON  MONGODB", 80, 400, 5, INK)
text("ASK THE BIRD ANYTHING ABOUT MY WORK", 80, 450, 4, (0x3D, 0x3F, 0x5C))

raw = b"".join(b"\x00" + bytes(v for p_ in row for v in p_) for row in px)
def chunk(tag, data):
    c = struct.pack(">I", len(data)) + tag + data
    return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(raw, 9))
       + chunk(b"IEND", b""))
out = ROOT / "og.png"
out.write_bytes(png)
print(f"wrote {out.name}  {W}x{H}  {len(png)/1024:.0f}KB")
