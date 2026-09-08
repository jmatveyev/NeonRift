# Neon Rift 1.7 - Cinematic Transit

[Play Neon Rift](https://jmatveyev.github.io/NeonRift/)

Neon Rift is an auto-firing arena-survival game for phones and desktop browsers.
Move, dodge, collect energy, choose sector upgrades, and build enough firepower
to defeat the Rift Sovereign. Standard, Endless, and Daily Signal are available
from the main screen. There are no seasons, season passes, or seasonal resets.

## What changed in 1.7

Between-sector travel is now a real 3D flight sequence. Your selected ship leaves
the current location, charges the rift drive, crosses a modeled jump corridor and
approaches the next of the nine distinct destinations. The old transition card is
now a compact flight-computer HUD over the cinematic rather than the scene itself.
Pause, skip, reduced-motion and safe-arrival behavior are retained.

The main hangar has a separate native-resolution showcase path. A sufficiently
large desktop display can render the home scene at a true **3840x2160** even while
Auto gameplay retains its lower performance budget. Striker, Ghost and Bastion use
higher-detail display-only models in the hangar; combat keeps its lighter meshes.
The menu reports the actual showcase resolution.

Standard gamepads are supported: left stick/D-pad move, A dashes, X activates
Overdrive and Menu/Start pauses. Upgrade choices support A/X/Y. Keyboard, mouse
and multitouch controls are unchanged.

Look for **1.7.0 / 3D CINEMATIC BUILD** under the logo. The game still explicitly
shows **2D COMPATIBILITY** when WebGL 2 is unavailable or selected off.

## Controls and graphics

On phones, drag the thumbstick and use another finger for **DASH** or **OVERDRIVE**.
Weapons aim and fire automatically. Left-handed controls are in the pause menu.
Portrait and landscape layouts are supported.

Desktop: **WASD / arrows** move, **Space** dashes, **E** activates Overdrive,
**1-3** selects upgrades, **Escape / P** pauses, and **R** retries after a run.
Mouse dragging also steers. Gamepad input is supported as described above.

The pause-menu Graphics selector offers Auto, Performance, High detail,
Ultra / up to 4K, and 2D compatibility. Ultra can allocate **3840x2160** gameplay
output on an appropriately sized display. The 1.7 home showcase may also use the
native 4K budget on desktop while gameplay stays balanced. Phone Auto remains
bounded and does not force a 4K workload.

## Saves and online services

Existing career, callsign, identity, settings, best scores and sector checkpoints
are preserved. Standard, Daily and Endless keep their existing checkpoint and
leaderboard behavior. This release changes neither Supabase schema nor backend
policies. Client-authoritative scores remain sanity-checked rather than being a
server-simulated competitive-authority model.

Core gameplay, models, effects and synthesized audio remain self-contained in the
launch HTML. Online leaderboards and telemetry need a connection. `index.html` and
`neon-rift.html` are built byte-identically.

## Source, validation and release status

1.7 source is under [`tools/visual-v17/`](tools/visual-v17/). Release behavior and
UAT are documented in [`docs/RELEASE-1.7.md`](docs/RELEASE-1.7.md).
The path from browser build to an actual iOS submission candidate is tracked in
[`docs/APP-STORE-READINESS.md`](docs/APP-STORE-READINESS.md).

The build starts from the exact pinned 1.6 artifact and refuses an unknown base.
The release workflow runs inherited controls, managed-play, audio, WebGL, journey,
checkpoint, location and 4K suites plus 1.7-specific cinematic/showcase/controller
UAT. Online requests are mocked during QA.

Browser CI is not physical-device certification. Real iPhone/iPad performance,
thermal/battery behavior, native lifecycle, Game Center, haptics, privacy metadata
and App Store packaging remain explicit gates before this project should be called
App Store-ready.
