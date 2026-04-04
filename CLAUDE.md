# CLAUDE.md — Koi Pond

## Project Overview

Koi Pond is an interactive, meditative web experience: a canvas-rendered pond with animated koi fish, lily pads, a dragonfly, water ripples, and a guided breathing mode. It is pure client-side JavaScript — no build tools, no npm, no framework dependencies.

## Repository Structure

```
koi-pond/
├── index.html                  # Main app (863 lines) — all UI, layout, inline scripts
├── preview-dragonfly.html      # Standalone dragonfly preview page
├── js/
│   ├── config.js               # All shared constants and koi variety definitions
│   ├── pond.js                 # Scene orchestrator — init, event handling, animation loop
│   ├── fish.js                 # Koi fish entity — spine animation, physics, drawing
│   ├── ripple.js               # Water ripple effect (click/drag interactions)
│   ├── lotus.js                # Lily pads and lotus flowers
│   ├── dragonfly.js            # Autonomous dragonfly (sunny weather only)
│   ├── breathing.js            # Breathing/meditation mode system
│   └── rain.js                 # Rain ripple class (implemented but not wired into main loop)
├── cobblestone_mornings.mp3    # Ambient background music
└── ethereal_resonance.mp3      # Breathing mode music
```

## Tech Stack

- **Rendering**: HTML5 Canvas 2D API (`fish-canvas`, z-index 2)
- **3D Background**: LiquidBackground from `threejs-components@0.0.30` via jsDelivr CDN (`liquid-canvas`, z-index 1)
- **Modules**: Native ES6 `import`/`export` (`type="module"` in `<script>` tags)
- **Audio**: HTML5 Audio API with crossfade between tracks
- **No build step**: Open `index.html` directly in a browser (or serve via any HTTP server for module CORS compliance)
- **Cache busting**: Query strings on module imports (e.g., `?v=39`) — increment when editing a file

## Key Constants (`js/config.js`)

| Constant | Value | Purpose |
|---|---|---|
| `FISH_COUNT` | 7 | Initial fish on load |
| `FEAR_RADIUS` | 150 | Pixels — fish flee distance from click |
| `FEAR_FORCE` | 3.5 | Flee impulse magnitude |
| `FEAR_DECAY` | 0.98 | Per-frame velocity decay |
| `WANDER_SPEED` | 0.8 | Base swim speed |
| `MAX_SPEED` | 4 | Speed cap |
| `TURN_RATE` | 0.02 | Steering angular rate |
| `TAIL_SPEED` | 0.08 | Tail wave frequency |
| `RIPPLE_MAX_RADIUS` | 120 | Max ripple expand radius |
| `RIPPLE_DURATION` | 60 | Frames per ripple |

`KOI_VARIETIES` is an array of 18 objects, each with:
```js
{ name, nameEn, body, spots, belly, accent?, tancho? }
```
All colors are CSS color strings. `tancho` (boolean) flags a red head-spot variety.

## Architecture

### Animation Loop (`pond.js`)

`requestAnimationFrame` drives everything via `loop()`:
1. Clear canvas
2. Draw pond texture
3. Update + draw lotus pads/flowers
4. Update + draw rain drops (rainy mode)
5. Update + draw each fish
6. Update + draw ripples
7. Update + draw dragonfly (sunny mode)
8. If breathing active: draw vignette + progress ring

### Fish (`fish.js`)

Each `Fish` instance has a 12-segment spine. On every frame:
- `update()`: wander steering, edge avoidance, inter-fish separation, apply flee forces
- `_buildSpine()`: recompute spine control points using sinusoidal wave
- `draw()`: shadow → body gradient → spots → fins → eyes

Use `Fish.fromVariety(x, y, size, variety)` (static factory) to create variety-accurate fish.

### Breathing Mode (`breathing.js`)

- Phases: **inhale 4s → exhale 6s** (repeating, no hold)
- Fish orbit a circle at radius `115–225%` of canvas dimensions
- Movement speed reduced to 40% during active breathing
- `easeOutCubic` for inhale, `easeInCubic` for exhale (eliminates mid-cycle pause)
- Music crossfades to `ethereal_resonance.mp3` on activate, back on deactivate

### Weather System (`index.html` inline script + `pond.js`)

- `setWeather('sunny' | 'rainy')` — global function on `window`
- Rainy mode: enables rain drops on lily pads, changes ambient visuals
- Dragonfly only appears during sunny mode

### Global API (exposed on `window` by `pond.js`)

```js
window.setWeather(mode)             // 'sunny' | 'rainy'
window.toggleBreathing()            // activate/deactivate breathing mode
window.isBreathingActive()          // returns boolean
window._crossfadeToBreathing()      // switch to ethereal music
window._crossfadeToNormal()         // switch to ambient music
window.addFish(variety)             // add fish by variety object
window.removeFish()                 // remove last fish
window.hasFish(variety)             // returns boolean
```

## Development Conventions

### Code Style

- **Classes**: PascalCase (`Fish`, `LilyPad`, `RippleManager`)
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE in `config.js`
- **Canvas transforms**: Always wrap in `ctx.save()` / `ctx.restore()`
- **Animation timing**: Use `performance.now()` for time-delta; `requestAnimationFrame` for looping
- **Physics**: Simple Euler integration — update velocity, then position

### Adding a New Koi Variety

1. Add an entry to `KOI_VARIETIES` in `js/config.js`
2. The koi selector card in `index.html` is generated dynamically — no HTML changes needed
3. The top-down card illustration is drawn by the inline canvas script in `index.html`; it reads `body`, `spots`, `belly`, `accent`, and `tancho` from the variety object

### Adding a New Entity (e.g., frog, turtle)

1. Create `js/entity.js` following the pattern: `constructor`, `update(w, h)`, `draw(ctx)`, optional `nudge(x, y)`
2. Import it in `pond.js` and instantiate in `init()`
3. Call `update()` and `draw()` in `loop()`

### Modifying Behavior Constants

All tweakable simulation values live in `js/config.js`. Prefer editing them there over hardcoding in entity files.

### Cache Busting

When editing any JS module, increment its query string version in the `import` statement in the file that imports it (usually `index.html` or `pond.js`):
```js
import { Fish } from './js/fish.js?v=40';  // was v=39
```

## UI Layout

- **Top-left**: Music toggle button (animated bars icon)
- **Bottom-left**: Breathing mode button (leaf/lotus icon, glows when active)
- **Bottom-center**: Weather tabs (Sunny / Rainy)
- **Bottom-right**: Add Koi button (opens floating variety selector panel)
- **Center**: Breathing phase label (Chinese: 吸气.../呼气...) — hidden when not in breathing mode

UI text is in Chinese. Koi variety names have both Chinese (`name`) and English (`nameEn`) fields.

## Known Incomplete Features

- `js/rain.js` — `RainRipple` and `RainManager` classes are implemented but not wired into the main `pond.js` loop. Rain visual effects currently use `lotus.js`'s `drawRainDrops()` instead.

## Running Locally

No installation required. Options:

```bash
# Python (simplest)
python3 -m http.server 8080

# Node (npx)
npx serve .

# Then open http://localhost:8080
```

Opening `index.html` directly as `file://` may fail for ES6 module imports due to browser CORS policy — use an HTTP server.

## Git Workflow

- Main branch: `main`
- Feature branches follow the pattern: `claude/<description>-<hash>`
- Commit messages are lowercase imperative (`feat:`, `fix:`, `ui:`, etc.)
- No CI/CD — this is a static site; deploy by copying files to any HTTP server or CDN
