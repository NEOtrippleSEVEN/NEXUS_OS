#!/usr/bin/env python3
"""
trace_logo.py — Convert the Nexus bonsai PNG (bright halftone dots on dark)
into a clean, animatable dot-cloud.

Strategy: resample the image onto a regular grid. Each cell that's "bright
enough" becomes one dot, whose value (0..1) maps to coverage/brightness so the
front-end can scale radius + opacity. Output is normalized to the bonsai's
bounding box so the UI can place/scale the tree freely.

Outputs:
  - JSON: { meta:{cols,rows,aspect,count}, dots:[{x,y,v}, ...] }  (x,y in 0..1)
  - SVG : dark dots on cream — a proof preview matching the home aesthetic.

Usage:
  python3 trace_logo.py --input public/nexus-logo.png \
      --cols 70 --threshold 165 --min-coverage 0.20 \
      --out-json src/data/bonsaiDots.json --out-svg tools/bonsai-preview.svg
  Optional crop (fractions of WxH): --crop 0.18,0.04,0.82,0.62
"""
import argparse, json, sys
from PIL import Image
import numpy as np


def luminance(img: Image.Image) -> np.ndarray:
    """Composite over black, return HxW float32 luminance 0..255."""
    img = img.convert("RGBA")
    arr = np.asarray(img).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0
    rgb = rgb * a  # bright dots sit on a dark/transparent ground
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def auto_bbox(lum: np.ndarray, thr: float):
    mask = lum >= thr
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    pad_x = max(1, int(0.01 * lum.shape[1]))
    pad_y = max(1, int(0.01 * lum.shape[0]))
    return (
        max(0, xs.min() - pad_x), max(0, ys.min() - pad_y),
        min(lum.shape[1], xs.max() + pad_x + 1),
        min(lum.shape[0], ys.max() + pad_y + 1),
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True)
    ap.add_argument("--cols", type=int, default=70)
    ap.add_argument("--threshold", type=float, default=165.0,
                    help="brightness 0..255 that counts as 'tree'")
    ap.add_argument("--min-coverage", type=float, default=0.20,
                    help="min fraction of bright pixels in a cell to emit a dot")
    ap.add_argument("--crop", type=str, default="",
                    help="l,t,r,b as fractions of width/height to isolate the bonsai")
    ap.add_argument("--out-json", default="src/data/bonsaiDots.json")
    ap.add_argument("--out-svg", default="tools/bonsai-preview.svg")
    a = ap.parse_args()

    img = Image.open(a.input)
    lum = luminance(img)
    H, W = lum.shape

    if a.crop:
        l, t, r, b = (float(x) for x in a.crop.split(","))
        lum = lum[int(t * H):int(b * H), int(l * W):int(r * W)]
        H, W = lum.shape

    bbox = auto_bbox(lum, a.threshold)
    if bbox is None:
        sys.exit(f"No pixels >= threshold {a.threshold}. Lower --threshold.")
    x0, y0, x1, y1 = bbox
    crop = lum[y0:y1, x0:x1]
    ch, cw = crop.shape
    aspect = cw / ch

    cols = a.cols
    rows = max(1, round(cols / aspect))
    cell_w, cell_h = cw / cols, ch / rows

    dots = []
    for r in range(rows):
        for c in range(cols):
            cell = crop[round(r * cell_h):round((r + 1) * cell_h),
                        round(c * cell_w):round((c + 1) * cell_w)]
            if cell.size == 0:
                continue
            coverage = float((cell >= a.threshold).mean())
            if coverage < a.min_coverage:
                continue
            dots.append({
                "x": round((c + 0.5) / cols, 4),
                "y": round((r + 0.5) / rows, 4),
                "v": round(min(1.0, coverage), 3),
            })

    meta = {"cols": cols, "rows": rows, "aspect": round(aspect, 4), "count": len(dots)}
    with open(a.out_json, "w") as f:
        json.dump({"meta": meta, "dots": dots}, f)

    # SVG proof: dark dots on cream, value -> radius+opacity
    vw, vh = cols * 10, rows * 10
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" '
        f'width="{vw}" height="{vh}"><rect width="{vw}" height="{vh}" fill="#F2F1ED"/>'
    ]
    for d in dots:
        cx, cy = d["x"] * vw, d["y"] * vh
        rr = 1.6 + d["v"] * 3.0
        op = 0.45 + d["v"] * 0.5
        parts.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.2f}" '
                     f'fill="#1A1A1A" opacity="{op:.2f}"/>')
    parts.append("</svg>")
    with open(a.out_svg, "w") as f:
        f.write("".join(parts))

    print(json.dumps({"ok": True, **meta,
                      "json": a.out_json, "svg": a.out_svg}))


if __name__ == "__main__":
    main()
