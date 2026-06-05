#!/usr/bin/env python3
"""
build_home_mock.py — Compose the Nexus OS home mockup from the traced bonsai.

Emits:
  - content/home-composition.html    (static fragment for the Visual Companion)
  - tools/_raster/home-interactive.html (standalone w/ cursor-proximity bloom JS)
  - tools/_raster/home-preview.html   (standalone shell for headless layout check)

Glass: gradient frosted Orb (dark only at the top for title contrast, genuinely
transparent below) over real see-through content (dot-grid + ambient dot scatter),
so the panel reads as glass. Chrome: taller frosted title bar w/ prominent wordmark;
chat bar + suggestion chips as the ground. Modules nest on data-derived pads.
"""
import json, pathlib, random

ROOT = pathlib.Path(__file__).resolve().parent.parent
data = json.load(open(ROOT / "src/data/bonsaiDots.json"))
dots = data["dots"]

# ---- canvas + tree geometry (SVG units) ----
CW, CH = 1000.0, 625.0
TREE_TOP = 82.0
TREE_H = 0.76 * CH
TREE_W = data["meta"]["aspect"] * TREE_H
TREE_CX = 420.0
def tx(px): return TREE_CX + (px - 0.5) * TREE_W
def ty(py): return TREE_TOP + py * TREE_H

PADS = {"main": (0.553, 0.117), "journey": (0.288, 0.230),
        "perf": (0.781, 0.318), "psych": (0.233, 0.422)}
padpx = {k: (tx(x), ty(y)) for k, (x, y) in PADS.items()}

# ---- tree dot-field ----
circles = []
for d in dots:
    cx, cy = tx(d["x"]), ty(d["y"])
    r = 1.3 + d["v"] * 2.4
    op = 0.40 + d["v"] * 0.5
    circles.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.2f}" opacity="{op:.2f}"/>')
tree_svg = "".join(circles)

# ---- ambient dots behind the Orb (seen through the glass = transparency cue) ----
rnd = random.Random(7)
amb = []
for _ in range(70):
    x = rnd.uniform(770, 980); y = rnd.uniform(100, 552)
    r = rnd.uniform(1.0, 3.0); op = rnd.uniform(0.12, 0.34)
    amb.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" opacity="{op:.2f}"/>')
# light motes: glow THROUGH the dark glass (dark dots would vanish on dark tint)
ambient_svg = '<g class="ambient" fill="#F7F4EC">' + "".join(amb) + '</g>'

# ---- module cards: pad + outward offset (SVG units) -> % ----
def pct(xu, yu): return (xu / CW * 100, yu / CH * 100)
OFFSET = {"main": (2, -42), "journey": (-46, -20), "perf": (84, -10), "psych": (-40, 34)}
META = {
    "main":    ("Main Goal",   "Your north star",                       "Reach $10k MRR by Q3"),
    "journey": ("Journey",     "Holygraph &middot; Planner &middot; To-dos",   "3 tasks queued today"),
    "perf":    ("Performance", "Work &middot; Sleep &middot; Habits",          "Sleep debt &middot; 1.2h"),
    "psych":   ("Psychology",  "Patterns &middot; biases &middot; archetypes", "Forecasting avoidance"),
}
card_html = []
for key in ("main", "journey", "perf", "psych"):
    px, py = padpx[key]; ox, oy = OFFSET[key]
    lx, ly = pct(px + ox, py + oy)
    name, sub, foot = META[key]
    card_html.append(
        f'<div class="mod" style="left:{lx:.1f}%;top:{ly:.1f}%;">'
        f'<div class="mod-name">{name}</div><div class="mod-sub">{sub}</div>'
        f'<div class="mod-foot"><span class="mdot"></span>{foot}</div></div>')
card_html = "".join(card_html)

GLYPH = ('<svg width="22" height="22" viewBox="0 0 18 18" style="vertical-align:-4px">'
         '<g fill="#1A1A1A">'
         '<circle cx="9" cy="3.2" r="1.6"/><circle cx="5.4" cy="5.5" r="1.5"/>'
         '<circle cx="12.6" cy="5.5" r="1.5"/><circle cx="9" cy="7.1" r="1.4"/>'
         '<circle cx="9" cy="10" r="1.2"/><circle cx="9" cy="12.3" r="1.2"/>'
         '<rect x="4.3" y="13.6" width="9.4" height="2.5" rx="1.1"/></g></svg>')

CSS = r'''
<style>
  .home { position:relative; width:100%; aspect-ratio:1000/625; background:#F2F1ED;
    background-image: radial-gradient(#CFCEC6 1.1px, transparent 1.1px); background-size:14px 14px;
    border-radius:16px; border:1px solid #E0DFD9; overflow:hidden; color:#1A1A1A;
    font-family:Inter,system-ui,sans-serif; box-shadow:0 12px 44px rgba(0,0,0,0.08); }

  /* frosted macOS title bar */
  .bar { position:absolute; top:0; left:0; right:0; height:9%; z-index:8;
    display:flex; align-items:center; padding:0 15px;
    background:rgba(244,243,239,0.72);
    -webkit-backdrop-filter:blur(10px) saturate(120%); backdrop-filter:blur(10px) saturate(120%);
    border-bottom:1px solid #E5E4DE; }
  .bar .lights { display:flex; gap:7px; }
  .bar .lights i { width:11px;height:11px;border-radius:50%;display:block; }
  .lr{background:#FF5F57}.ly{background:#FEBC2E}.lg{background:#28C840}
  .brand { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
    display:flex; flex-direction:column; align-items:center; line-height:1; }
  .brand .row { display:flex; align-items:center; gap:8px; }
  .brand .wm { font-weight:800; letter-spacing:-0.035em; font-size:22px; color:#1A1A1A; }
  .brand .tg { font-size:8.5px; color:#9B9B9B; margin-top:4px; letter-spacing:.18em; text-transform:uppercase; }
  .bar .right { margin-left:auto; display:flex; align-items:center; gap:9px; }
  .kbd { font-size:9.5px; color:#8B8B8B; background:#EFEEE9; border:1px solid #E0DFD9;
    border-radius:7px; padding:4px 9px; }
  .av { width:20px;height:20px;border-radius:50%;
    background:radial-gradient(circle at 35% 30%, #fff, #d7d7df 60%, #9a9aa4); border:1px solid #d8d8d8; }

  /* tree */
  .svglayer { position:absolute; inset:0; width:100%; height:100%; z-index:1; }
  .tree circle { fill:#1A1A1A; }

  /* module cards */
  .mod { position:absolute; transform:translate(-50%,-50%); width:150px;
    background:rgba(250,250,247,0.90); border:1px solid #E0DFD9; border-radius:12px;
    padding:9px 11px; box-shadow:0 5px 18px rgba(0,0,0,0.08); z-index:4;
    -webkit-backdrop-filter:blur(3px); backdrop-filter:blur(3px);
    cursor:pointer; transition:transform .18s, box-shadow .18s; }
  .mod:hover { transform:translate(-50%,-50%) translateY(-2px); box-shadow:0 9px 24px rgba(0,0,0,0.13); }
  .mod-name { font-weight:600; font-size:13px; color:#1A1A1A; }
  .mod-sub { color:#6B6B6B; font-size:9px; margin-top:2px; line-height:1.35; }
  .mod-foot { display:flex; align-items:center; gap:6px; margin-top:7px; padding-top:6px;
    border-top:1px solid #ECEBE5; font-size:9px; color:#9B9B9B; }
  .mdot { width:5px;height:5px;border-radius:50%; background:#C5C4BE; display:inline-block; }

  /* Orb — DARK frosted glass DONE RIGHT: a UNIFORM low-alpha tint (no vertical
     value ramp — the ramp is exactly what read as a "painted gradient" before) +
     strong blur, with a soft top-left glint for the glass rim. Light motes seeded
     behind it glow THROUGH the tint = the unmistakable see-through tell. */
  .orb { position:absolute; top:13%; right:1.6%; width:21.5%; height:80%;
    background:
      radial-gradient(135% 85% at 15% -12%, rgba(255,255,255,0.13), rgba(255,255,255,0) 56%),
      rgba(17,17,23,0.33);
    -webkit-backdrop-filter:blur(22px) saturate(136%) brightness(0.94);
            backdrop-filter:blur(22px) saturate(136%) brightness(0.94);
    border:1px solid rgba(255,255,255,0.16); border-radius:18px; padding:14px 13px;
    color:#F1F1F4; box-shadow:0 20px 52px rgba(0,0,0,0.30),
      inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(255,255,255,0.05); z-index:6; }
  .sphere { width:56px;height:56px;border-radius:50%;margin:4px auto 10px;
    background:radial-gradient(circle at 36% 30%, #ffffff 0%, #ededf2 24%, #c4c4cf 56%, #74747f 100%);
    box-shadow:0 0 30px rgba(255,255,255,0.55), inset 0 -7px 12px rgba(0,0,0,0.22); }
  .orb h4 { margin:0; text-align:center; font-size:13px; font-weight:700; color:#fff;
    letter-spacing:-0.01em; text-shadow:0 1px 5px rgba(0,0,0,0.45); }
  .orb .osub { text-align:center; font-size:8px; color:#D7D7DE; margin-top:3px;
    text-transform:uppercase; letter-spacing:.12em; text-shadow:0 1px 3px rgba(0,0,0,0.4); }
  .obub { background:rgba(10,10,16,0.30); border:1px solid rgba(255,255,255,0.12);
    border-radius:10px; padding:9px; margin-top:14px;
    -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
  .obub .chip { font-size:7.5px; color:#c8c8d0; text-transform:uppercase; letter-spacing:.13em; font-weight:600; }
  .obub p { font-size:9px; line-height:1.45; margin:4px 0 0; color:#F1F1F5; }
  .oin { background:rgba(10,10,16,0.30); border:1px solid rgba(255,255,255,0.12);
    border-radius:9px; height:26px; margin-top:11px; display:flex; align-items:center;
    padding:0 5px 0 10px; color:#c0c0c8; font-size:9px;
    -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); }
  .oin .s { margin-left:auto; background:rgba(255,255,255,0.92); border-radius:6px; padding:3px 9px; color:#161616; font-weight:600; }

  /* ground: chat bar + suggestion chips */
  .chips { position:absolute; bottom:calc(6% + 50px); left:42%; transform:translateX(-50%);
    display:flex; gap:7px; z-index:7; }
  .chip-s { font-size:9.5px; color:#6B6B6B; background:rgba(255,255,255,0.86);
    border:1px solid #E5E4DE; border-radius:999px; padding:5px 11px;
    -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px); box-shadow:0 2px 8px rgba(0,0,0,0.04); }
  .chip-s b { color:#1A1A1A; font-weight:600; }
  .chatbar { position:absolute; bottom:6%; left:42%; transform:translateX(-50%);
    width:42%; min-width:300px; height:42px; background:#fff; border:1px solid #E5E4DE;
    border-radius:13px; display:flex; align-items:center; gap:9px; padding:0 8px 0 9px;
    color:#9B9B9B; font-size:12px; z-index:7;
    box-shadow:0 10px 26px rgba(0,0,0,0.08), 0 0 0 4px rgba(26,26,26,0.022); }
  .chatbar .ai { width:24px;height:24px;border-radius:7px; flex:none;
    background:radial-gradient(circle at 36% 32%, #fff, #e6e6ec 45%, #aeaeb8); border:1px solid #e2e2e2; }
  .chatbar .ph { flex:1; }
  .chatbar .model { font-size:9.5px; color:#6B6B6B; background:#F2F1ED; border:1px solid #E5E4DE;
    border-radius:7px; padding:4px 9px; }
  .chatbar .send { width:28px;height:28px;border-radius:8px;background:#1A1A1A;
    color:#fff; font-size:13px; display:flex; align-items:center; justify-content:center; flex:none; }

  /* bloom affordance — fades out on first cursor move (interactive page) */
  .hint { position:absolute; left:16px; bottom:14px; z-index:9; display:flex; align-items:center; gap:7px;
    font-size:10px; color:#7A7A82; background:rgba(255,255,255,0.82); border:1px solid #E5E4DE;
    border-radius:999px; padding:5px 11px 5px 9px; box-shadow:0 2px 8px rgba(0,0,0,0.05);
    -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
    transition:opacity .5s ease, transform .5s ease; }
  .hint.gone { opacity:0; transform:translateY(6px); pointer-events:none; }
  .hint .pulse { width:7px;height:7px;border-radius:50%; background:#1A1A1A; flex:none;
    animation:hp 1.8s ease-out infinite; }
  @keyframes hp { 0%{box-shadow:0 0 0 0 rgba(26,26,26,0.35);}
    70%{box-shadow:0 0 0 7px rgba(26,26,26,0);} 100%{box-shadow:0 0 0 0 rgba(26,26,26,0);} }
</style>'''

BODY = f'''
<div class="home" id="nexusHome">
  <div class="bar">
    <div class="lights"><i class="lr"></i><i class="ly"></i><i class="lg"></i></div>
    <div class="brand">
      <div class="row">{GLYPH}<span class="wm">Nexus&nbsp;OS</span></div>
      <div class="tg">The Founder's Operating System</div>
    </div>
    <div class="right"><span class="kbd">&#8984;K&nbsp;&nbsp;Search</span><span class="av"></span></div>
  </div>

  <svg class="svglayer" viewBox="0 0 {CW:.0f} {CH:.0f}" preserveAspectRatio="xMidYMid meet">
    {ambient_svg}
    <g class="tree">{tree_svg}</g>
  </svg>

  {card_html}

  <div class="chips">
    <span class="chip-s"><b>Plan</b>&nbsp;my day</span>
    <span class="chip-s"><b>Review</b>&nbsp;goals</span>
    <span class="chip-s">What&rsquo;s&nbsp;<b>off</b>&nbsp;today?</span>
  </div>
  <div class="chatbar">
    <span class="ai"></span><span class="ph">Ask Nexus anything&hellip;</span>
    <span class="model">Orb &#9662;</span><span class="send">&uarr;</span>
  </div>

  <div class="orb">
    <div class="sphere"></div>
    <h4>The Orb</h4><div class="osub">Contextually aware AI</div>
    <div class="obub"><div class="chip">Nexus</div>
      <p>Your planning session ran 15 min short &mdash; that matches the forecasting-avoidance pattern. Pre-commit tomorrow's deep-work block?</p></div>
    <div class="oin">Find a message&hellip; <span class="s">Send</span></div>
  </div>

  <div class="hint" id="bloomHint"><span class="pulse"></span>Move your cursor over the tree</div>
</div>'''

BLOOM_JS = r'''
<script>
(function(){
  var home = document.getElementById('nexusHome');
  if(!home) return;
  var svg = home.querySelector('.svglayer');
  var circles = Array.prototype.slice.call(svg.querySelectorAll('.tree circle'));
  var base = circles.map(function(c){
    return { c:c, r:parseFloat(c.getAttribute('r')),
             x:parseFloat(c.getAttribute('cx')), y:parseFloat(c.getAttribute('cy')),
             cur:parseFloat(c.getAttribute('r')) };
  });
  var hint = document.getElementById('bloomHint');
  var mouse = null, R = 150, AMP = 3.8, t0 = performance.now();
  var userMoved = false, demoStart = t0, DEMO_MS = 5400, demoEnded = false;
  function toSvg(e){
    var rect = svg.getBoundingClientRect();
    if(!rect.width || !rect.height) return null;
    var s = Math.min(rect.width/1000, rect.height/625);
    var ox = (rect.width - 1000*s)/2, oy = (rect.height - 625*s)/2;
    return { x:(e.clientX-rect.left-ox)/s, y:(e.clientY-rect.top-oy)/s };
  }
  function onMove(e){
    userMoved = true; mouse = toSvg(e);
    if(hint) hint.classList.add('gone');
  }
  home.addEventListener('pointermove', onMove);
  home.addEventListener('mousemove', onMove);
  home.addEventListener('pointerleave', function(){ if(userMoved) mouse = null; });
  home.addEventListener('mouseleave', function(){ if(userMoved) mouse = null; });
  function frame(now){
    var time = (now - t0) / 1000;
    // auto-demo: sweep a virtual cursor through the canopy on load so the bloom
    // is unmistakable with zero input; the real cursor takes over instantly.
    if(!userMoved && !demoEnded){
      var dt = now - demoStart;
      if(dt < DEMO_MS){
        var p = dt / DEMO_MS;
        mouse = { x: 250 + p*330, y: 296 + Math.sin(p*Math.PI*3.0)*150 };
      } else { demoEnded = true; mouse = null; }
    }
    for(var i=0;i<base.length;i++){
      var b = base[i];
      // always-on breathing so the dot-field is visibly alive, even before hover
      var target = b.r + 0.45*Math.sin(time*1.2 + b.x*0.05 + b.y*0.035);
      if(mouse){
        var dx=b.x-mouse.x, dy=b.y-mouse.y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<R){ var t=1-d/R; target += t*t*AMP*(1+b.r*0.5); }
      }
      b.cur += (target - b.cur)*0.20;
      b.c.setAttribute('r', (b.cur>0.3?b.cur:0.3).toFixed(2));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
</script>'''

INTRO = '''<h2>Home &mdash; light-glass Orb + living dot-field</h2>
<p class="subtitle">The Orb is now <b>light</b> frosted glass (the dot-grid &amp; ambient scatter read straight through it &mdash; no more dark painted gradient), matching the title bar &amp; chips you approved. The tree dot-field gently <b>breathes</b> on its own and <b>blooms</b> under the cursor. This companion view is static &mdash; open the live link below to feel it.</p>'''

frag = INTRO + CSS + BODY
(ROOT / ".superpowers/brainstorm/22395-1780610760/content/home-composition.html").write_text(frag)

LIVEBAR = ('<div class="livebar"><span class="dot"></span>'
           '<b>LIVE</b>&nbsp;&mdash; the tree auto-demos for ~5s on load, then follows your cursor. '
           'You\'re on the interactive page (the companion tab can\'t run JS).</div>')
inter = ('<!doctype html><html><head><meta charset="utf-8">'
         '<meta name="viewport" content="width=device-width, initial-scale=1">'
         '<meta http-equiv="Cache-Control" content="no-store">'
         '<title>Nexus OS — live</title>'
         '<style>html,body{margin:0;background:#0d0d10;}'
         '.wrap{max-width:1120px;margin:0 auto;padding:18px 24px 24px;}'
         '.livebar{display:flex;align-items:center;gap:9px;margin:0 0 13px;'
         'font-family:Inter,system-ui,sans-serif;color:#c9cad1;font-size:12.5px;}'
         '.livebar b{color:#eaffef;}'
         '.livebar .dot{width:8px;height:8px;border-radius:50%;background:#54e08a;flex:none;'
         'animation:lb 1.6s ease-out infinite;}'
         '@keyframes lb{0%{box-shadow:0 0 0 0 rgba(84,224,138,0.55);}'
         '70%{box-shadow:0 0 0 9px rgba(84,224,138,0);}100%{box-shadow:0 0 0 0 rgba(84,224,138,0);}}'
         '</style></head>'
         '<body><div class="wrap">' + LIVEBAR + CSS + BODY + '</div>' + BLOOM_JS + '</body></html>')
(ROOT / "tools/_raster/home-interactive.html").write_text(inter)

shell = ('<!doctype html><html><head><meta charset="utf-8">'
         '<style>body{margin:0;padding:26px;background:#0d0d10;font-family:Inter,sans-serif;}'
         'h2{color:#fff;font-size:20px;margin:0 0 6px;}'
         '.subtitle{color:#9aa;font-size:12px;margin:0 0 18px;max-width:880px;line-height:1.5;}'
         '.wrap{max-width:1040px;margin:0 auto;}</style></head>'
         '<body><div class="wrap">' + frag + '</div></body></html>')
(ROOT / "tools/_raster/home-preview.html").write_text(shell)

print("ok: companion + home-interactive.html + preview; dots=%d" % len(dots))
