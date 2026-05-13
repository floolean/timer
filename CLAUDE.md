# Kitchen Timer PWA — Claude Context

## Project

Vanilla JS PWA deployed on GitHub Pages at `/timer/`. No build step, no dependencies. Files: `index.html`, `index.css`, `index.js`, `manifest.json`, `service-worker.js`.

## Current feature state

- **Multiple timers** — run concurrently, persist to `localStorage`, survive page reload
- **Overtime** — timers continue into negative time after zero; display turns amber and blinks
- **Sound style picker** — header button cycles Beep → Chime → Bell → Blip, previews on cycle, persisted to `localStorage`
  - Beep: two square-wave pulses
  - Chime: C-E-G sine chord
  - Bell: 880 Hz sine with long exponential decay
  - Blip: two short high sine pulses
- **Sound on/off toggle** — persisted to `localStorage`
- **iOS audio backgrounding** — `AudioContext` is nulled on `visibilitychange: hidden`; on foreground return a fullscreen overlay ("Sound paused") appears when a timer is running, prompting a tap to re-init — this satisfies iOS's user-gesture requirement. Do not remove this overlay; it is the correct fix.
- **Theme toggle** — dark/light, persisted to `localStorage`; dark charcoal surfaces, amber `#f5a623` accent, DM Mono + Fraunces fonts
- **Timer cards** — left color strip, sidebar Start/Pause/Reset buttons divided by hairlines, color picker (blue/green/amber/red/purple) per timer
- **Landscape layout** — two-column grid at `max-width: 1200px`; header hides at `max-height: 500px` (phones in landscape only)
- **Wake lock** — requested on interaction, re-requested on foreground return
- **Notifications** — via service worker if permission granted

## Key constraints

- iOS Safari is the primary target; test audio and layout changes there first
- No framework, no bundler — keep it that way
- HTTPS required in production for service workers; `python3 -m http.server` for local dev
