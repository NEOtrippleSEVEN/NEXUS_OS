#!/usr/bin/env python3
"""
clean_dots.py — Denoise a traced dot-cloud.

Drops isolated specks and thin 1-px trails (e.g. swirl remnants that survive
thresholding) by requiring each dot to have enough close neighbours. Operates on
the grid implied by meta.cols/rows so "neighbour" means an adjacent cell.

Keeps a dot when (occupied neighbours within Chebyshev radius R) >= min_neighbors.
A dot on a thin horizontal/vertical line has only ~2 neighbours and is removed;
foliage/pot/trunk dots sit in dense clusters (4-8) and survive.

Usage:
  python3 clean_dots.py --in dots.json --out dots.clean.json \
      --radius 1 --min-neighbors 3 --out-svg proof.svg
"""
import argparse, json


def grid_index(d, cols, rows):
    gx = min(cols - 1, max(0, int(d["x"] * cols)))
    gy = min(rows - 1, max(0, int(d["y"] * rows)))
    return gx, gy


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--out-svg", default="")
    ap.add_argument("--radius", type=int, default=1)
    ap.add_argument("--min-neighbors", type=int, default=3)
    ap.add_argument("--trim", default="",
                    help="grid boxes to delete: 'cLo,cHi,rLo,rHi;...' (inclusive)")
    a = ap.parse_args()

    data = json.load(open(a.inp))
    cols, rows = data["meta"]["cols"], data["meta"]["rows"]
    dots = data["dots"]

    boxes = []
    if a.trim:
        for b in a.trim.split(";"):
            if b.strip():
                cl, ch, rl, rh = (int(x) for x in b.split(","))
                boxes.append((cl, ch, rl, rh))

    def in_trim(gx, gy):
        return any(cl <= gx <= ch and rl <= gy <= rh for cl, ch, rl, rh in boxes)

    occupied = {}
    for d in dots:
        gx, gy = grid_index(d, cols, rows)
        if not in_trim(gx, gy):
            occupied[(gx, gy)] = d

    R = a.radius
    kept = []
    for d in dots:
        gx, gy = grid_index(d, cols, rows)
        if in_trim(gx, gy):
            continue
        n = 0
        for dy in range(-R, R + 1):
            for dx in range(-R, R + 1):
                if dx == 0 and dy == 0:
                    continue
                if (gx + dx, gy + dy) in occupied:
                    n += 1
        if n >= a.min_neighbors:
            kept.append(d)

    meta = dict(data["meta"])
    meta["count"] = len(kept)
    json.dump({"meta": meta, "dots": kept}, open(a.out, "w"))

    if a.out_svg:
        vw, vh = cols * 10, rows * 10
        parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" '
            f'width="{vw}" height="{vh}"><rect width="{vw}" height="{vh}" fill="#F2F1ED"/>'
        ]
        for d in kept:
            cx, cy = d["x"] * vw, d["y"] * vh
            rr = 1.6 + d["v"] * 3.0
            op = 0.45 + d["v"] * 0.5
            parts.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{rr:.2f}" '
                         f'fill="#1A1A1A" opacity="{op:.2f}"/>')
        parts.append("</svg>")
        open(a.out_svg, "w").write("".join(parts))

    print(json.dumps({"ok": True, "in": len(dots), "out": len(kept),
                      "dropped": len(dots) - len(kept)}))


if __name__ == "__main__":
    main()
