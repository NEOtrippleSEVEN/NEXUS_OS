# Nexus OS — Home / Dashboard Screen (V1) — Design Specification

- **Status:** Locked (design intent approved 2026-06-05; visual polish on Orb glass + in-browser bloom confirmation carried as implementation acceptance criteria)
- **Surface:** Web app — React 18 + Vite 5 + Tailwind v3
- **Scope:** The single Home/Dashboard screen ("the founder's operating system"). Not the full app.
- **Source artifacts:** `tools/build_home_mock.py` (mock generator), `tools/_raster/home-interactive.html` (live interaction prototype), `src/data/bonsaiDots.json` (frozen dot-field data), `public/Logo_Nexus_icondesign.svg` (logo source).

---

## 1. Intent

Nexus OS is a "co-founder" operating system for solo founders. The Home screen is the daily landing surface: it shows the founder their **north-star goal, journey/plan, performance, and psychology** at a glance, and gives them a single conversational entry point (the chat bar) to drive the system.

The screen must **not** look like a generic AI dashboard (grid of equal cards). The organizing metaphor is a **living bonsai tree, traced from the Nexus logo**, that literally grows out of the chat bar. The four life-domains the product tracks are not cards floating on a grid — they are the **canopy of the tree**. The tree is rendered as a field of dots (a vector dot-cloud) that is quietly alive: it breathes, and it blooms toward the cursor.

This metaphor is the product's signature and the reason the screen is memorable. Everything else (chrome, Orb, chat bar) is in service of it.

### Design principles (from the founder's standing guidance)
- Reject generic AI UI templates. Production-grade components, strict hierarchy, minimalist spacing.
- Favor **dot-grid** layouts and **frosted-glass** surfaces.
- Asymmetry over symmetry — the tree is a *real* bonsai (off-center, irregular), never a mandala.

---

## 2. The core concept (locked)

A **light cream canvas** with a subtle dot-grid, wearing **macOS window chrome**. Anchored to the **bottom-center** is the **chat bar — the "ground."** From that ground a **bonsai tree ascends**: pot → trunk → asymmetric canopy. The tree is a **dot-vector field** of 746 dots traced from the founder's own logo.

- The **four module cards nest ON the foliage pads** — the modules *are* the canopy.
- The tree **breathes** continuously (subtle) and **blooms** under cursor proximity (pronounced) — dots near the pointer swell.
- A **frosted-glass Orb** panel sits on the right: the contextually-aware AI presence (a luminous pearl + a live message).
- The whole thing reads as **one organism**, not a set of widgets.

```
┌───────────────────────────────────────────────────────────────┐
│ ◖◗◯   ⬡ Nexus OS   The Founder's Operating System    ⌘K  ◍   │  title bar (frosted)
│        · · · · · · · · · · · · · · · · · · ·                    │
│      ┌──────────┐        ⢀⡠⠔ Main Goal ⠢⡀          ╭─────────╮ │
│      │ Journey  │     ⡠⠊  (crown / apex)  ⠑⢄        │   ◐     │ │
│      └──────────┘   ⢰   ·:·  dot canopy  ·:·  ⡆     │ The Orb │ │
│      ┌──────────┐   ⠘⢄   ⟍ Performance ⟋    ⡠⠃     │ frosted │ │
│      │Psychology│      ⠑⠢⡀  trunk   ⢀⠔⠊            │  glass  │ │
│      └──────────┘          ║ pot ║                  │  +pearl │ │
│           [Plan my day][Review goals][What's off?]  ╰─────────╯ │
│              ┌─ Ask Nexus anything…  [Orb ▾] [↑] ─┐             │  chat bar = ground
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Visual system

### Color tokens
| Token | Value | Use |
|---|---|---|
| `--canvas` | `#F2F1ED` | Page background (warm cream) |
| `--grid-dot` | `#CFCEC6` | Dot-grid specks |
| `--ink` | `#1A1A1A` | Tree dots, primary text, send button |
| `--ink-soft` | `#6B6B6B` / `#9B9B9B` | Secondary / tertiary text |
| `--card` | `rgba(250,250,247,0.90)` | Module card fill |
| `--hairline` | `#E0DFD9` / `#E5E4DE` | Borders |
| Orb tint | `rgba(17,17,23,0.33)` | Dark glass body |
| Orb mote | `#F7F4EC` | Luminous particles behind glass |

### Background dot-grid
`radial-gradient(var(--grid-dot) 1.1px, transparent 1.1px)` at `background-size: 14px 14px`.

### Typography
- Inter / system-ui.
- Wordmark **"Nexus OS"**: weight 800, ~22px, letter-spacing -0.035em.
- Tagline: **"The Founder's Operating System"**, 8.5px, uppercase, letter-spacing 0.18em, `#9B9B9B`.
- Card title 13px/600; card sub 9px/`#6B6B6B`; card footer 9px/`#9B9B9B`.

### Window chrome (macOS)
- Frosted title bar, height ~9% of canvas: `rgba(244,243,239,0.72)` + `backdrop-filter: blur(10px) saturate(120%)`, bottom hairline.
- Traffic lights (left): `#FF5F57` / `#FEBC2E` / `#28C840`, 11px.
- Centered brand: bonsai **glyph** (small dot-SVG) + wordmark + tagline.
- Right: `⌘K Search` pill + pearl avatar.
- Canvas itself is a rounded window: `border-radius:16px`, hairline border, soft drop shadow. **Chrome approved by founder.**

---

## 4. Layout anatomy

Reference composition uses an SVG/overlay canvas of **1000 × 625** (aspect 1.6). All positions below are expressed against that reference; the React build is responsive (the canvas scales, the SVG uses `preserveAspectRatio="xMidYMid meet"`).

| Region | Placement | z |
|---|---|---|
| Title bar | top, full width, height 9% | 8 |
| Tree dot-field (SVG) | `inset:0`, full canvas | 1 |
| Ambient motes (SVG) | behind Orb (x≈770–980, y≈100–552) | 1 |
| Module cards ×4 | absolutely placed on pad anchors | 4 |
| Orb panel | `top:13%; right:1.6%; width:21.5%; height:80%` | 6 |
| Suggestion chips | above chat bar, centered on `left:42%` | 7 |
| Chat bar ("ground") | `bottom:6%; left:42%; width:42%` | 7 |
| Bloom hint chip | bottom-left, fades on first cursor move | 9 |

> **Note on horizontal balance:** the tree is centered at `cx ≈ 420` (left-of-center) to leave room for the Orb on the right; the chat bar/chips are centered at `left:42%` to sit under the tree's base, not the page center. This asymmetry is intentional.

---

## 5. The bonsai dot-field (the tree)

### Data — `src/data/bonsaiDots.json` (FROZEN)
- Traced from `public/Logo_Nexus_icondesign.svg` via the pipeline in §11.
- **746 dots** (density variant "B", chosen by founder).
- Schema:
  ```json
  {
    "meta": { "cols": 46, "rows": 60, "aspect": 0.766, "count": 746 },
    "dots": [ { "x": 0.50, "y": 0.14, "v": 0.62 }, ... ]
  }
  ```
  - `x`, `y` ∈ [0,1] — normalized position within the bonsai bounding box.
  - `v` ∈ [0,1] — ink density at that dot (drives radius + opacity).

### Geometry (reference mapping into the 1000×625 canvas)
```
TREE_TOP = 82
TREE_H   = 0.76 * 625 = 475
TREE_W   = aspect(0.766) * 475 ≈ 364
TREE_CX  = 420
x_px = TREE_CX + (dot.x - 0.5) * TREE_W
y_px = TREE_TOP + dot.y * TREE_H
```

### Per-dot rendering
- radius `r = 1.3 + v * 2.4`
- opacity `op = 0.40 + v * 0.5`
- fill `var(--ink)` (`#1A1A1A`)
- Rendered as SVG `<circle>` elements inside `<g class="tree">`.

The tree is **strongly asymmetric** (a real bonsai silhouette), rising from a pot at the base that visually sits on the chat bar.

---

## 6. Module cards on foliage pads (locked)

The four modules nest on canopy pads. Pad anchors were derived by k-means over the canopy dots; mapping approved by founder ("they do sit nested good").

| Module | Pad anchor (normalized in bonsai bbox) | Semantic placement | Card copy (placeholder) |
|---|---|---|---|
| **Main Goal** | (0.553, 0.117) | **Crown / apex** — the north star at the top | "Your north star" · "Reach $10k MRR by Q3" |
| **Journey** | (0.288, 0.230) | Upper-left pad | "Holygraph · Planner · To-dos" · "3 tasks queued today" |
| **Performance** | (0.781, 0.318) | Right pad | "Work · Sleep · Habits" · "Sleep debt · 1.2h" |
| **Psychology** | (0.233, 0.422) | Lower-left pad | "Patterns · biases · archetypes" · "Forecasting avoidance" |

- Card center is offset outward from its pad so the card body clears the canopy while a connector still reads it as "growing from" the pad. Reference offsets (px from pad): main (2,−42), journey (−46,−20), perf (84,−10), psych (−40,34).
- Card: 150px wide, `rgba(250,250,247,0.90)` + `backdrop-filter:blur(3px)`, hairline, 12px radius, soft shadow; hover lifts `translateY(-2px)` with a deeper shadow.
- Card anatomy: **name** (13/600), **subtitle** (domains, 9px), **footer** (a single live datapoint with a small node dot).
- **Removed:** the earlier green pad-node markers (founder flagged them as "random green dots").

---

## 7. Signature interaction — the cursor-proximity bloom

The tree is alive. Two layers, both implemented in a single `requestAnimationFrame` loop that mutates each dot's `r` attribute.

### 7a. Idle breathing (always on)
Every dot's target radius gets a small sinusoidal offset so the whole field shimmers gently, proving it's live before any interaction:
```
target = baseR + 0.45 * sin(time*1.2 + x*0.05 + y*0.035)
```

### 7b. Proximity bloom (on cursor)
Dots within radius **R = 150** (canvas units) of the pointer swell, more the closer they are and the larger their base:
```
d = distance(dot, cursor)
if d < R:
    t = 1 - d/R
    target += t*t * AMP * (1 + baseR*0.5)      // AMP = 3.8
```
Each frame eases current → target: `cur += (target - cur) * 0.20`, then `circle.r = max(0.3, cur)`.

### Pointer → canvas coordinate mapping
The SVG renders with `preserveAspectRatio="xMidYMid meet"`, so screen coordinates must be converted with the letterbox offset:
```
rect = svg.getBoundingClientRect()
s  = min(rect.width/1000, rect.height/625)
ox = (rect.width  - 1000*s)/2
oy = (rect.height -  625*s)/2
cursor = { x:(clientX-rect.left-ox)/s, y:(clientY-rect.top-oy)/s }
```
Listen to **both** `pointermove` and `mousemove` (and `pointerleave`/`mouseleave` to release). Guard against a zero-size measurement (return null).

### On-load auto-demo
For the first ~5.4s after load (until the user moves), a virtual cursor sweeps the canopy so the bloom self-demonstrates, then hands off to the real cursor instantly on first move:
```
p = elapsed / 5400
virtualCursor = { x: 250 + p*330, y: 296 + sin(p*π*3)*150 }
```

### Verification (DevTools / CDP, real Chrome)
- Hovering a dense dot grew it **3.81 → 10.71** (≈3×).
- The auto-demo (zero input) bloomed **22 dots past r=6, max r ≈ 10.04**.
- **Zero runtime exceptions / console errors.**
- ⇒ The interaction model is proven. Headless screenshots cannot show it live and **`backdrop-filter` is flattened in headless** — real-browser confirmation is the verifier (see §13).

### Performance & accessibility
- 746 nodes mutated per frame is cheap; keep it on one rAF loop, avoid layout thrash (only `r` changes).
- Pause the loop when the tab is hidden (`visibilitychange`) and when `prefers-reduced-motion: reduce` (no breathing; bloom optional/disabled).
- Provide a static fallback: if JS is disabled, dots render at base radius (still a complete, legible tree).

---

## 8. The Orb (frosted dark glass)

The AI presence — a translucent **dark** frosted-glass panel on the right through which the cream canvas and luminous motes are softly visible.

### Composition
- **Luminous pearl sphere** (radial white→grey, soft outer glow) — the focal element.
- Title **"The Orb"**, subtitle **"Contextually aware AI"** (uppercase, tracked).
- A **NEXUS message bubble** (contextual, e.g. *"Your planning session ran 15 min short — that matches the forecasting-avoidance pattern. Pre-commit tomorrow's deep-work block?"*).
- A **"Find a message…"** input with a **Send** button.

### Glass recipe (the corrected one)
The earlier dark version failed because it used a **vertical dark→light linear gradient**, which reads as a *painted gradient*, not glass. The locked recipe avoids any value ramp:
```css
background:
  radial-gradient(135% 85% at 15% -12%, rgba(255,255,255,0.13), rgba(255,255,255,0) 56%),  /* single corner glint */
  rgba(17,17,23,0.33);                                                                      /* UNIFORM dark tint  */
backdrop-filter: blur(22px) saturate(136%) brightness(0.94);
border: 1px solid rgba(255,255,255,0.16);
box-shadow: 0 20px 52px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.26);
```
- **Light motes** (`#F7F4EC`, 70 dots, op 0.12–0.34) are seeded behind the panel so they glow *through* the tint — the see-through tell that sells "glass."
- Inner content blocks (message bubble, input) use `rgba(10,10,16,0.30)` + `blur(6px)` backings with light text for legibility.
- **Fallback** (`@supports not (backdrop-filter: blur())` or low-power): a more opaque solid `rgba(20,20,26,0.92)` so text stays legible without the blur.

> **Open polish item:** the founder reported the Orb "still looks solid" in their viewing context. The most likely cause is viewing the **static companion** (no live compositing) and/or `backdrop-filter` being flattened/unsupported in that view. The real React build composites natively. Final read-as-glass confirmation in the founder's browser is an acceptance criterion (§13).

---

## 9. The ground — chat bar + suggestion chips

The chat bar is the **base of the tree** (the pot rests on it) and the primary input.

- **Suggestion chips** (above the bar, founder-requested): **"Plan my day" · "Review goals" · "What's off today?"** — pill, `rgba(255,255,255,0.86)` + blur, the verb emphasized.
- **Chat bar:** pearl AI orb icon · placeholder **"Ask Nexus anything…"** · **"Orb ▾"** model chip · dark **↑** send button. White fill, 13px radius, soft shadow + faint focus ring.

---

## 10. Parked / deferred

- **Sub-goal "buds"** along the branches (e.g. "Today's 3", "Sleep 7h", "$10k MRR"). Founder feedback: "randomly scattered and very difficult to see." **Deferred** to a dedicated pass that makes them legible and interactive (anchor to specific branch tips, reveal on bloom/hover, connect to their parent module). Not in V1.

---

## 11. Logo → dot-field pipeline (provenance)

Reproducible pipeline (one-time; output is the frozen JSON):
1. **Source:** `public/Logo_Nexus_icondesign.svg` (vertical 768×1376; paths are large organic blobs, not point dots).
2. **Rasterize** with headless Chrome → `tools/_raster/Logo_Nexus_icondesign.png` (no rsvg/cairo/inkscape available).
3. **Trace** (`tools/trace_logo.py`): tight crop to the bonsai region + luminance threshold (~114–128) + grid resample → normalized dot-cloud.
4. **Denoise** (`tools/clean_dots.py`): keep dots with ≥ `min_neighbors` occupied neighbors within a Chebyshev radius; `--trim` removes artifact "wing" grid-boxes. Settings used: `--radius 1 --min-neighbors 3 --trim "0,5,21,30;42,45,20,30"`.
5. **Freeze** → `src/data/bonsaiDots.json` (variant B, 746 dots).
6. **Pad anchors** via k-means over canopy dots → the §6 module coordinates.

---

## 12. Technical approach (for the build plan)

> This section orients the implementation plan; it is not the plan itself.

- **Stack:** React 18 + Vite 5 + Tailwind v3 (scaffold exists; `npm install` not yet run).
- **Data import:** `import bonsaiDots from '@/data/bonsaiDots.json'`.
- **Suggested component tree:**
  - `HomeScreen` — the rounded window shell, dot-grid background, layout regions.
  - `TitleBar` — traffic lights, brand (glyph + wordmark + tagline), search pill, avatar.
  - `BonsaiField` — the SVG dot-field; owns the rAF bloom/breathing loop and pointer handling. Exposes pad anchor coordinates.
  - `ModuleCard` ×4 — positioned from pad anchors + offsets; props: name, subtitle, footer datapoint.
  - `OrbPanel` — frosted glass, pearl, message bubble, input.
  - `GroundBar` — suggestion chips + chat input.
- **Bloom location:** inside `BonsaiField` via `useRef` + a single `requestAnimationFrame` loop in `useEffect` (cleanup on unmount; honor reduced-motion + visibility). Mutate `r` imperatively on the circle refs — do **not** re-render React per frame.
- **Responsiveness:** the window scales; the SVG `viewBox` + `preserveAspectRatio` keeps the tree intact; module cards positioned in % so they track pads. Define a min-width before switching to a stacked/mobile treatment (mobile layout out of scope for V1).
- **Glass:** Tailwind `backdrop-blur` utilities + a small custom layer for the tint/glint; include the `@supports` fallback.

---

## 13. Acceptance criteria & open questions

**Acceptance criteria**
- [ ] In the founder's real browser, the tree **breathes** and **blooms** under the cursor (auto-demo visible on load). *(Code proven via CDP; needs founder's in-browser sign-off — the repeated "nothing" was almost certainly the static companion tab, not the live page.)*
- [ ] In the founder's real browser, the Orb reads as **translucent dark glass** (motes/canvas visible through it), not a flat panel. *(Needs sign-off; provide the `@supports` fallback.)*
- [ ] Modules visibly nest on the foliage pads; no stray markers.
- [ ] Chrome matches the approved mock (wordmark prominence, chips, chat bar).
- [ ] `prefers-reduced-motion` and hidden-tab both pause the animation; JS-off renders a static tree.

**Open questions (resolve during planning/build)**
1. Are module datapoints (footer lines) wired to real data in V1, or placeholder copy? (Assume placeholder; data-binding is a later milestone.)
2. Does clicking a module navigate (route to that domain) or expand in place? (Out of scope for the Home *visual* spec; flag for the plan.)
3. Exact connector treatment between a card and its pad (line? none? on-hover?) — currently none; revisit if it reads as floating.
4. Sub-goal buds revival (parked, §10) — separate spec.

---

## 14. Out of scope (V1)
- Real backend / live data binding for module footers and the Orb message.
- Sub-goal buds.
- Mobile / narrow layout.
- The other Nexus OS screens (only Home is specified here).
- Theming / dark mode of the whole canvas (the canvas is light by design; only the Orb is dark glass).
